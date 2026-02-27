import { eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { users } from '../database/drizzle-schema/schema.schema';

export class UsersRepository {
  constructor(private db: NeonHttpDatabase) {}

  async findByIp(ipAddress: string) {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.ipAddress, ipAddress))
      .limit(1);
    return results[0] ?? null;
  }

  async create(data: { name: string; email?: string; ipAddress: string }) {
    const results = await this.db
      .insert(users)
      .values(data)
      .returning();
    return results[0];
  }
}
