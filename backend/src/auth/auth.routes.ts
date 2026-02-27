import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRoutes = new Hono<{ Bindings: Env }>()
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const db = getDb(c.env.DATABASE_URL);
    const repo = new AuthRepository(db);
    const service = new AuthService(repo, c.env.JWT_SECRET);

    const result = await service.login(email, password);
    if (!result) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    return c.json(result);
  });
