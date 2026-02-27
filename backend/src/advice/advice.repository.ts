import { eq, desc } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { adviceBox, users } from '../database/drizzle-schema/schema.schema';

export class AdviceRepository {
  constructor(private db: NeonHttpDatabase) {}

  async create(data: {
    userId: string;
    guestName: string;
    advice: string;
    sessionId: string;
    ipAddress?: string | null;
  }) {
    const results = await this.db
      .insert(adviceBox)
      .values(data)
      .returning();
    return results[0];
  }

  async findBySessionId(sessionId: string) {
    const results = await this.db
      .select({
        id: adviceBox.id,
        guestName: adviceBox.guestName,
        advice: adviceBox.advice,
        createdAt: adviceBox.createdAt,
      })
      .from(adviceBox)
      .where(eq(adviceBox.sessionId, sessionId))
      .limit(1);
    return results[0] ?? null;
  }

  async updateBySessionId(
    sessionId: string,
    data: {
      guestName: string;
      advice: string;
      ipAddress?: string | null;
    }
  ) {
    const results = await this.db
      .update(adviceBox)
      .set(data)
      .where(eq(adviceBox.sessionId, sessionId))
      .returning();
    return results[0];
  }

  async findAllPublic() {
    return this.db
      .select({
        id: adviceBox.id,
        guestName: adviceBox.guestName,
        createdAt: adviceBox.createdAt,
      })
      .from(adviceBox)
      .orderBy(desc(adviceBox.createdAt));
  }

  async findAll() {
    return this.db
      .select({
        id: adviceBox.id,
        guestName: adviceBox.guestName,
        advice: adviceBox.advice,
        createdAt: adviceBox.createdAt,
      })
      .from(adviceBox)
      .orderBy(desc(adviceBox.createdAt));
  }

  async deleteById(id: string) {
    const results = await this.db
      .delete(adviceBox)
      .where(eq(adviceBox.id, id))
      .returning();
    return results[0] ?? null;
  }

  async findAllAdmin() {
    return this.db
      .select({
        id: adviceBox.id,
        userId: adviceBox.userId,
        guestName: adviceBox.guestName,
        advice: adviceBox.advice,
        sessionId: adviceBox.sessionId,
        userEmail: users.email,
        ipAddress: adviceBox.ipAddress,
        createdAt: adviceBox.createdAt,
      })
      .from(adviceBox)
      .innerJoin(users, eq(adviceBox.userId, users.id))
      .orderBy(desc(adviceBox.createdAt));
  }
}
