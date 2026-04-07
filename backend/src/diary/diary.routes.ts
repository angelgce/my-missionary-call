import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { authMiddleware } from '../auth/auth.middleware';
import { DiaryRepository } from './diary.repository';
import { DiaryService, R2Config } from './diary.service';

function buildService(env: Env): DiaryService {
  const db = getDb(env.DATABASE_URL);
  const repo = new DiaryRepository(db);
  const r2: R2Config = {
    endpoint: env.R2_ENDPOINT,
    bucketName: env.R2_BUCKET_NAME,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
  return new DiaryService(repo, r2);
}

const updateEntrySchema = z.object({
  content: z.string().min(1),
});

// All endpoints are admin-only. There is no public diary route by design.
export const diaryRoutes = new Hono<{ Bindings: Env }>()
  .get('/', authMiddleware, async (c) => {
    const service = buildService(c.env);
    const entries = await service.listAll();
    return c.json(entries);
  })
  .get('/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const service = buildService(c.env);
    const entry = await service.getEntryWithImages(id);
    if (!entry) return c.json({ message: 'Not found' }, 404);
    return c.json(entry);
  })
  .put('/:id', authMiddleware, zValidator('json', updateEntrySchema), async (c) => {
    const id = c.req.param('id');
    const { content } = c.req.valid('json');
    const service = buildService(c.env);
    const updated = await service.updateEntry(id, content);
    if (!updated) return c.json({ message: 'Not found' }, 404);
    return c.json(updated);
  })
  .delete('/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const service = buildService(c.env);
    const deleted = await service.deleteEntry(id);
    if (!deleted) return c.json({ message: 'Not found' }, 404);
    return c.json({ deleted: true });
  })
  .delete('/images/:imageId', authMiddleware, async (c) => {
    const imageId = c.req.param('imageId');
    const service = buildService(c.env);
    const deleted = await service.removeImage(imageId);
    if (!deleted) return c.json({ message: 'Not found' }, 404);
    return c.json({ deleted: true });
  });
