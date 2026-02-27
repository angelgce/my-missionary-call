import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { authMiddleware } from '../auth/auth.middleware';
import { PredictionsRepository } from './predictions.repository';
import { PredictionsService } from './predictions.service';

const createPredictionSchema = z.object({
  userId: z.string().uuid(),
  guestName: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().min(1),
  state: z.string().min(1),
  stateCode: z.string().min(1),
  city: z.string().min(1),
  sessionId: z.string().min(1),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const predictionsRoutes = new Hono<{ Bindings: Env }>()
  .post('/', zValidator('json', createPredictionSchema), async (c) => {
    const data = c.req.valid('json');
    const ipAddress = c.req.header('cf-connecting-ip')
      || c.req.header('x-forwarded-for')
      || 'unknown';

    const db = getDb(c.env.DATABASE_URL);
    const repo = new PredictionsRepository(db);
    const service = new PredictionsService(repo);

    const { prediction, created } = await service.createOrUpdate({
      ...data,
      ipAddress,
    });
    return c.json(prediction, created ? 201 : 200);
  })
  .get('/session/:sessionId', async (c) => {
    const sessionId = c.req.param('sessionId');
    const db = getDb(c.env.DATABASE_URL);
    const repo = new PredictionsRepository(db);
    const service = new PredictionsService(repo);

    const prediction = await service.getBySessionId(sessionId);
    if (!prediction) {
      return c.json({ message: 'Not found' }, 404);
    }
    return c.json(prediction);
  })
  .get('/', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const repo = new PredictionsRepository(db);
    const service = new PredictionsService(repo);

    const predictions = await service.getAll();
    return c.json(predictions);
  })
  .get('/admin', authMiddleware, async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const repo = new PredictionsRepository(db);
    const service = new PredictionsService(repo);

    const predictions = await service.getAllAdmin();
    return c.json(predictions);
  });
