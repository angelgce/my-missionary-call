import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { aiRoutes } from './ai/ai.routes';

export type Env = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_HOST: string;
  AI: Ai;
  KV: KVNamespace;
  // Add more bindings here (Hyperdrive, R2, etc.)
};

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env.FRONTEND_HOST || 'http://localhost:5173';
    return origin === allowed ? origin : '';
  },
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/api/ai', aiRoutes);
// app.route('/api/auth', authRoutes);
// app.route('/api/users', userRoutes);

export default app;
