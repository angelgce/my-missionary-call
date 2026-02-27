import { eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { userAdmin } from '../database/drizzle-schema/schema.schema';

export class AuthRepository {
  constructor(private db: NeonHttpDatabase) {}

  async findAdminByEmail(email: string) {
    const results = await this.db
      .select()
      .from(userAdmin)
      .where(eq(userAdmin.email, email))
      .limit(1);
    return results[0] ?? null;
  }
}
