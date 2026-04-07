import { eq, desc, asc, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { customAlphabet } from 'nanoid';

import { blogPosts, blogPostImages } from '../database/drizzle-schema/schema.schema';

// Short, URL-friendly IDs (no ambiguous chars). 10 chars ≈ very low collision risk for our scale.
const generateId = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 10);

export interface CreatePostData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageKey: string;
  author?: string;
  readTime?: string;
  isPublished?: boolean;
}

export interface UpdatePostData {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  coverImageKey?: string;
  author?: string;
  readTime?: string;
  isPublished?: boolean;
}

export class BlogRepository {
  constructor(private db: NeonHttpDatabase) {}

  async create(data: CreatePostData) {
    const results = await this.db
      .insert(blogPosts)
      .values({
        id: generateId(),
        ...data,
        publishedAt: data.isPublished ? new Date() : null,
      })
      .returning();
    return results[0];
  }

  async update(id: string, data: UpdatePostData) {
    const patch: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.isPublished === true) {
      patch.publishedAt = new Date();
    }
    const results = await this.db
      .update(blogPosts)
      .set(patch)
      .where(eq(blogPosts.id, id))
      .returning();
    return results[0] ?? null;
  }

  async deleteById(id: string) {
    const results = await this.db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();
    return results[0] ?? null;
  }

  async findById(id: string) {
    const results = await this.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);
    return results[0] ?? null;
  }

  async findBySlug(slug: string) {
    const results = await this.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);
    return results[0] ?? null;
  }

  async findAllPublished() {
    return this.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async findAllAdmin() {
    return this.db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));
  }

  async findPublishedBySlug(slug: string) {
    const results = await this.db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
      .limit(1);
    return results[0] ?? null;
  }

  async addImage(postId: string, imageKey: string, sortOrder: number) {
    const results = await this.db
      .insert(blogPostImages)
      .values({ id: generateId(), postId, imageKey, sortOrder })
      .returning();
    return results[0];
  }

  async findImagesByPostId(postId: string) {
    return this.db
      .select()
      .from(blogPostImages)
      .where(eq(blogPostImages.postId, postId))
      .orderBy(asc(blogPostImages.sortOrder));
  }

  async deleteImageById(id: string) {
    const results = await this.db
      .delete(blogPostImages)
      .where(eq(blogPostImages.id, id))
      .returning();
    return results[0] ?? null;
  }
}
