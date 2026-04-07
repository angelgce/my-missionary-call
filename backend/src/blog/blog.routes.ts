import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { authMiddleware } from '../auth/auth.middleware';
import { BlogRepository } from './blog.repository';
import { BlogService, R2Config } from './blog.service';

const createPostSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(1),
  excerpt: z.string().default(''),
  content: z.string().default(''),
  coverImageKey: z.string().default(''),
  author: z.string().optional(),
  readTime: z.string().optional(),
  isPublished: z.boolean().optional(),
});

const updatePostSchema = createPostSchema.partial();

const addImageSchema = z.object({
  imageKey: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

function buildService(env: Env): BlogService {
  const db = getDb(env.DATABASE_URL);
  const repo = new BlogRepository(db);
  const r2: R2Config = {
    endpoint: env.R2_ENDPOINT,
    bucketName: env.R2_BUCKET_NAME,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
  return new BlogService(repo, r2);
}

export const blogRoutes = new Hono<{ Bindings: Env }>()
  // ───── Public ─────
  .get('/posts', async (c) => {
    const service = buildService(c.env);
    const posts = await service.listPublic();
    return c.json(posts);
  })
  .get('/posts/:slug', async (c) => {
    const slug = c.req.param('slug');
    const service = buildService(c.env);
    const post = await service.getPublicBySlug(slug);
    if (!post) return c.json({ message: 'Not found' }, 404);
    return c.json(post);
  })

  // ───── Admin ─────
  .get('/admin/posts', authMiddleware, async (c) => {
    const service = buildService(c.env);
    const posts = await service.listAdmin();
    return c.json(posts);
  })
  .get('/admin/posts/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const service = buildService(c.env);
    const post = await service.getAdminById(id);
    if (!post) return c.json({ message: 'Not found' }, 404);
    return c.json(post);
  })
  .post('/admin/posts', authMiddleware, zValidator('json', createPostSchema), async (c) => {
    const data = c.req.valid('json');
    const service = buildService(c.env);
    const created = await service.createPost({
      slug: data.slug ?? '',
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      coverImageKey: data.coverImageKey,
      author: data.author,
      readTime: data.readTime,
      isPublished: data.isPublished,
    });
    return c.json(created, 201);
  })
  .put('/admin/posts/:id', authMiddleware, zValidator('json', updatePostSchema), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const service = buildService(c.env);
    const updated = await service.updatePost(id, data);
    if (!updated) return c.json({ message: 'Not found' }, 404);
    return c.json(updated);
  })
  .delete('/admin/posts/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const service = buildService(c.env);
    const deleted = await service.deletePost(id);
    if (!deleted) return c.json({ message: 'Not found' }, 404);
    return c.json({ deleted: true });
  })

  // ───── Image upload (admin) ─────
  // Multipart upload — uploads file directly to R2 via Workers binding.
  .post('/admin/posts/:id/upload', authMiddleware, async (c) => {
    const postId = c.req.param('id');
    const form = await c.req.formData();
    const file = form.get('file') as unknown as File | null;
    if (!file || typeof file === 'string' || typeof (file as File).arrayBuffer !== 'function') {
      return c.json({ message: 'Missing file' }, 400);
    }

    const service = buildService(c.env);
    const key = service.buildImageKey(postId, file.name);

    await c.env.R2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });

    return c.json({ key });
  })
  .post(
    '/admin/posts/:id/images',
    authMiddleware,
    zValidator('json', addImageSchema),
    async (c) => {
      const postId = c.req.param('id');
      const { imageKey, sortOrder } = c.req.valid('json');
      const service = buildService(c.env);
      const created = await service.addImageToPost(postId, imageKey, sortOrder);
      return c.json(created, 201);
    }
  )
  .delete('/admin/images/:imageId', authMiddleware, async (c) => {
    const imageId = c.req.param('imageId');
    const service = buildService(c.env);
    const deleted = await service.removeImage(imageId);
    if (!deleted) return c.json({ message: 'Not found' }, 404);
    return c.json({ deleted: true });
  });
