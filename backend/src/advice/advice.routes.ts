import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { authMiddleware } from '../auth/auth.middleware';
import { AdviceRepository } from './advice.repository';
import { AdviceService } from './advice.service';

const createAdviceSchema = z.object({
  userId: z.string().uuid(),
  guestName: z.string().min(1),
  advice: z.string().min(1),
  sessionId: z.string().min(1),
});

export const adviceRoutes = new Hono<{ Bindings: Env }>()
  .post('/', zValidator('json', createAdviceSchema), async (c) => {
    const data = c.req.valid('json');
    const ipAddress = c.req.header('cf-connecting-ip')
      || c.req.header('x-forwarded-for')
      || 'unknown';

    const db = getDb(c.env.DATABASE_URL);
    const repo = new AdviceRepository(db);
    const service = new AdviceService(repo);

    const created = await service.create({
      ...data,
      ipAddress,
    });
    return c.json(created, 201);
  })
  .get('/public', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const repo = new AdviceRepository(db);
    const service = new AdviceService(repo);

    const advices = await service.getAllPublic();
    return c.json(advices);
  })
  .get('/', authMiddleware, async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const repo = new AdviceRepository(db);
    const service = new AdviceService(repo);

    const advices = await service.getAllAdmin();
    return c.json(advices);
  })
  .delete('/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    const repo = new AdviceRepository(db);
    const service = new AdviceService(repo);

    const deleted = await service.deleteById(id);
    if (!deleted) {
      return c.json({ message: 'Not found' }, 404);
    }
    return c.json({ deleted: true });
  });
