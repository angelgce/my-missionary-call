import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});

export const userRoutes = new Hono<{ Bindings: Env }>()
  .post('/', zValidator('json', createUserSchema), async (c) => {
    const { name, email } = c.req.valid('json');
    const ipAddress = c.req.header('cf-connecting-ip')
      || c.req.header('x-forwarded-for')
      || 'unknown';

    const db = getDb(c.env.DATABASE_URL);
    const repo = new UsersRepository(db);
    const service = new UsersService(repo);

    const user = await service.getOrCreateUser(name, ipAddress, email);
    return c.json(user, 201);
  });
