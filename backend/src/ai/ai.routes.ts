import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AIService } from './ai.service';
import type { Env } from '../worker';

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1),
});

const completionSchema = z.object({
  prompt: z.string().min(1),
});

export const aiRoutes = new Hono<{ Bindings: Env }>()
  .post('/chat', zValidator('json', chatSchema), async (c) => {
    const { messages } = c.req.valid('json');
    const aiService = new AIService(c.env.AI);
    const result = await aiService.chat(messages);
    return c.json(result);
  })
  .post('/completion', zValidator('json', completionSchema), async (c) => {
    const { prompt } = c.req.valid('json');
    const aiService = new AIService(c.env.AI);
    const result = await aiService.completion(prompt);
    return c.json(result);
  });
