import { eq, desc } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { predictions, users } from '../database/drizzle-schema/schema.schema';

export class PredictionsRepository {
  constructor(private db: NeonHttpDatabase) {}

  async create(data: {
    userId: string;
    guestName: string;
    country: string;
    countryCode: string;
    state: string;
    stateCode: string;
    city: string;
    sessionId: string;
    latitude?: string | null;
    longitude?: string | null;
    ipAddress?: string | null;
  }) {
    const results = await this.db
      .insert(predictions)
      .values(data)
      .returning();
    return results[0];
  }

  async findBySessionId(sessionId: string) {
    const results = await this.db
      .select({
        id: predictions.id,
        country: predictions.country,
        countryCode: predictions.countryCode,
        state: predictions.state,
        stateCode: predictions.stateCode,
        city: predictions.city,
        latitude: predictions.latitude,
        longitude: predictions.longitude,
        guestName: predictions.guestName,
        createdAt: predictions.createdAt,
      })
      .from(predictions)
      .where(eq(predictions.sessionId, sessionId))
      .limit(1);
    return results[0] ?? null;
  }

  async updateBySessionId(
    sessionId: string,
    data: {
      guestName: string;
      country: string;
      countryCode: string;
      state: string;
      stateCode: string;
      city: string;
      latitude?: string | null;
      longitude?: string | null;
      ipAddress?: string | null;
    }
  ) {
    const results = await this.db
      .update(predictions)
      .set(data)
      .where(eq(predictions.sessionId, sessionId))
      .returning();
    return results[0];
  }

  async findAll() {
    return this.db
      .select({
        id: predictions.id,
        country: predictions.country,
        countryCode: predictions.countryCode,
        state: predictions.state,
        stateCode: predictions.stateCode,
        city: predictions.city,
        latitude: predictions.latitude,
        longitude: predictions.longitude,
        guestName: predictions.guestName,
        createdAt: predictions.createdAt,
      })
      .from(predictions)
      .orderBy(desc(predictions.createdAt));
  }

  async findAllAdmin() {
    return this.db
      .select({
        id: predictions.id,
        userId: predictions.userId,
        country: predictions.country,
        countryCode: predictions.countryCode,
        state: predictions.state,
        stateCode: predictions.stateCode,
        city: predictions.city,
        latitude: predictions.latitude,
        longitude: predictions.longitude,
        sessionId: predictions.sessionId,
        guestName: predictions.guestName,
        userEmail: users.email,
        ipAddress: predictions.ipAddress,
        createdAt: predictions.createdAt,
      })
      .from(predictions)
      .innerJoin(users, eq(predictions.userId, users.id))
      .orderBy(desc(predictions.createdAt));
  }
}
