import { eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { revelation } from '../database/drizzle-schema/schema.schema';

export class RevelationRepository {
  constructor(private db: NeonHttpDatabase) {}

  async findFirst() {
    const results = await this.db.select().from(revelation).limit(1);
    return results[0] ?? null;
  }

  async upsert(data: {
    missionaryName: string;
    missionaryAddress: string;
    missionName: string;
    language: string;
    trainingCenter: string;
    entryDate: string;
    letterDate: string;
    pdfText?: string;
    normalizedPdfText?: string;
    isRevealed?: boolean;
  }) {
    const existing = await this.findFirst();

    if (existing) {
      const results = await this.db
        .update(revelation)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(revelation.id, existing.id))
        .returning();
      return results[0];
    }

    const results = await this.db
      .insert(revelation)
      .values(data)
      .returning();
    return results[0];
  }

  async toggleReveal() {
    const existing = await this.findFirst();
    if (!existing) return null;

    const results = await this.db
      .update(revelation)
      .set({ isRevealed: !existing.isRevealed, updatedAt: new Date() })
      .where(eq(revelation.id, existing.id))
      .returning();
    return results[0];
  }

  async updateMissionaryName(encryptedName: string) {
    const existing = await this.findFirst();
    if (!existing) return null;

    const results = await this.db
      .update(revelation)
      .set({ missionaryName: encryptedName, updatedAt: new Date() })
      .where(eq(revelation.id, existing.id))
      .returning();
    return results[0];
  }

  async updateEventSettings(data: {
    openingDate: string;
    locationAddress: string;
    locationUrl: string;
  }) {
    const existing = await this.findFirst();
    if (!existing) return null;

    const results = await this.db
      .update(revelation)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(revelation.id, existing.id))
      .returning();
    return results[0];
  }
}
