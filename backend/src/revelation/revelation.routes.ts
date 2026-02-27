import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { authMiddleware } from '../auth/auth.middleware';
import { RevelationRepository } from './revelation.repository';
import { RevelationService } from './revelation.service';
import { AIService } from '../ai/ai.service';

const eventSettingsSchema = z.object({
  openingDate: z.string(),
  locationAddress: z.string(),
  locationUrl: z.string(),
});

const updateSchema = z.object({
  missionaryName: z.string().min(1),
  missionName: z.string().min(1),
  language: z.string().min(1),
  trainingCenter: z.string().min(1),
  entryDate: z.string().min(1),
});

function getService(env: Env) {
  const db = getDb(env.DATABASE_URL);
  const repo = new RevelationRepository(db);
  return new RevelationService(repo, env.ENCRYPTION_KEY);
}

export const revelationRoutes = new Hono<{ Bindings: Env }>()
  .get('/', async (c) => {
    const service = getService(c.env);
    const rev = await service.get();
    return c.json(rev);
  })
  .get('/admin', authMiddleware, async (c) => {
    const service = getService(c.env);
    const rev = await service.getAdmin();
    return c.json(rev);
  })
  .get('/destination', async (c) => {
    try {
      const service = getService(c.env);
      const result = await service.getDestinationCoordinates(c.env.AI, c.env.KV);
      if (!result) {
        return c.json({ error: 'Not yet revealed' }, 403);
      }
      return c.json(result);
    } catch (error) {
      console.error('Destination geocode error:', error);
      return c.json({ error: 'Failed to get destination coordinates' }, 500);
    }
  })
  .get('/event-settings', async (c) => {
    const service = getService(c.env);
    const settings = await service.getEventSettings();
    if (!settings) {
      return c.json({ error: 'No revelation found' }, 404);
    }
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    return c.json(settings);
  })
  .put('/event-settings', authMiddleware, zValidator('json', eventSettingsSchema), async (c) => {
    const data = c.req.valid('json');
    const service = getService(c.env);
    const result = await service.updateEventSettings(data);
    if (!result) {
      return c.json({ error: 'No revelation found' }, 404);
    }
    return c.json(result);
  })
  .put('/', authMiddleware, zValidator('json', updateSchema), async (c) => {
    const data = c.req.valid('json');
    const service = getService(c.env);
    const rev = await service.update(data);
    return c.json(rev);
  })
  .patch(
    '/missionary-name',
    authMiddleware,
    zValidator('json', z.object({ missionaryName: z.string().min(1) })),
    async (c) => {
      const { missionaryName } = c.req.valid('json');
      const service = getService(c.env);
      const rev = await service.updateMissionaryName(missionaryName);
      if (!rev) {
        return c.json({ error: 'No revelation found' }, 404);
      }
      return c.json({ success: true, missionaryName });
    },
  )
  .patch('/reveal', authMiddleware, async (c) => {
    const service = getService(c.env);
    const rev = await service.toggleReveal();
    if (!rev) {
      return c.json({ error: 'No revelation found' }, 404);
    }
    return c.json(rev);
  })
  .post(
    '/extract-pdf',
    authMiddleware,
    zValidator('json', z.object({ text: z.string().min(1) })),
    async (c) => {
      try {
        const { text } = c.req.valid('json');

        // Use AI to extract structured data from PDF text
        const aiService = new AIService(c.env.AI);
        const extracted = await aiService.extractMissionaryCall(text);

        // Save encrypted to DB (including raw PDF text)
        const service = getService(c.env);
        await service.updateFromPdf({ ...extracted, pdfText: text });

        // Only return missionaryName, keep the rest hidden
        return c.json({
          success: true,
          missionaryName: extracted.missionaryName,
        });
      } catch (error) {
        console.error('PDF extract error:', error);
        return c.json({ error: 'Failed to extract data from PDF' }, 500);
      }
    },
  )
  .post(
    '/extract-pdf-preview',
    authMiddleware,
    zValidator('json', z.object({ text: z.string().min(1) })),
    async (c) => {
      try {
        const { text } = c.req.valid('json');
        const aiService = new AIService(c.env.AI);
        const extracted = await aiService.extractMissionaryCall(text);
        return c.json({
          success: true,
          data: extracted,
        });
      } catch (error) {
        console.error('PDF extract preview error:', error);
        return c.json({ error: 'Failed to extract data from PDF' }, 500);
      }
    },
  )
  .post(
    '/confirm-pdf',
    authMiddleware,
    zValidator(
      'json',
      z.object({
        missionaryName: z.string().default(''),
        missionName: z.string().default(''),
        language: z.string().default(''),
        trainingCenter: z.string().default(''),
        entryDate: z.string().default(''),
        pdfText: z.string().min(1),
      }),
    ),
    async (c) => {
      try {
        const data = c.req.valid('json');

        const service = getService(c.env);
        await service.updateFromPdf(data);
        return c.json({ success: true });
      } catch (error) {
        console.error('PDF confirm error:', error);
        return c.json({ error: 'Failed to save data' }, 500);
      }
    },
  );
