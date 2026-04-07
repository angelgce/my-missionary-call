import { eq, desc, asc } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { customAlphabet } from 'nanoid';

import { diaryEntries, diaryEntryImages } from '../database/drizzle-schema/schema.schema';

const generateId = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 10);

export class DiaryRepository {
  constructor(private db: NeonHttpDatabase) {}

  async create(content: string) {
    const results = await this.db
      .insert(diaryEntries)
      .values({ id: generateId(), content })
      .returning();
    return results[0];
  }

  async update(id: string, content: string) {
    const results = await this.db
      .update(diaryEntries)
      .set({ content, updatedAt: new Date() })
      .where(eq(diaryEntries.id, id))
      .returning();
    return results[0] ?? null;
  }

  async deleteById(id: string) {
    const results = await this.db
      .delete(diaryEntries)
      .where(eq(diaryEntries.id, id))
      .returning();
    return results[0] ?? null;
  }

  async findById(id: string) {
    const results = await this.db
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.id, id))
      .limit(1);
    return results[0] ?? null;
  }

  async findAll() {
    return this.db
      .select()
      .from(diaryEntries)
      .orderBy(desc(diaryEntries.createdAt));
  }

  async addImage(entryId: string, imageKey: string, sortOrder: number) {
    const results = await this.db
      .insert(diaryEntryImages)
      .values({ id: generateId(), entryId, imageKey, sortOrder })
      .returning();
    return results[0];
  }

  async findImagesByEntryId(entryId: string) {
    return this.db
      .select()
      .from(diaryEntryImages)
      .where(eq(diaryEntryImages.entryId, entryId))
      .orderBy(asc(diaryEntryImages.sortOrder));
  }

  async deleteImageById(id: string) {
    const results = await this.db
      .delete(diaryEntryImages)
      .where(eq(diaryEntryImages.id, id))
      .returning();
    return results[0] ?? null;
  }
}
