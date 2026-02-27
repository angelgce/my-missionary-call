import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { RevelationRepository } from '../revelation/revelation.repository';
import { decryptRevelation } from '../lib/encryption';
import { ChatService } from './chat.service';

const chatSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().optional(),
});

const deleteSchema = z.object({
  sessionId: z.string().min(1),
});

export const chatRoutes = new Hono<{ Bindings: Env }>()
  .post('/', zValidator('json', chatSchema), async (c) => {
    try {
      const { sessionId, message } = c.req.valid('json');
      const chatService = new ChatService();

      // Always ensure session exists
      const existing = await chatService.getSession(c.env.KV, sessionId);

      if (!existing) {
        const db = getDb(c.env.DATABASE_URL);
        const repo = new RevelationRepository(db);
        const rev = await repo.findFirst();

        if (!rev) {
          return c.json({ error: 'No revelation data found' }, 404);
        }

        const decrypted = await decryptRevelation(
          {
            missionaryName: rev.missionaryName,
            missionName: rev.missionName,
            language: rev.language,
            trainingCenter: rev.trainingCenter,
            entryDate: rev.entryDate,
          },
          c.env.ENCRYPTION_KEY,
        );

        const initResult = await chatService.initSession(c.env.KV, c.env.AI, sessionId, {
          missionName: decrypted.missionName,
          language: decrypted.language,
          trainingCenter: decrypted.trainingCenter,
          entryDate: decrypted.entryDate,
        });

        // If no message, just return the initialized session
        if (!message) {
          return c.json(initResult);
        }
      }

      // If no message, return current session state
      if (!message) {
        const session = await chatService.getSession(c.env.KV, sessionId);
        return c.json(session);
      }

      // Send message and get hint
      const result = await chatService.sendMessage(c.env.KV, c.env.AI, sessionId, message);
      return c.json(result);
    } catch (error) {
      console.error('Chat error:', error);
      return c.json({ error: 'Failed to process chat' }, 500);
    }
  })
  .delete('/', zValidator('json', deleteSchema), async (c) => {
    try {
      const { sessionId } = c.req.valid('json');
      await c.env.KV.delete(`chat:${sessionId}`);
      return c.json({ deleted: true });
    } catch (error) {
      console.error('Chat delete error:', error);
      return c.json({ error: 'Failed to delete chat' }, 500);
    }
  });
