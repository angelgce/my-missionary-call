import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { aiRoutes } from './ai/ai.routes';
import { authRoutes } from './auth/auth.routes';
import { userRoutes } from './users/users.routes';
import { predictionsRoutes } from './predictions/predictions.routes';
import { revelationRoutes } from './revelation/revelation.routes';
import { assetsRoutes } from './assets/assets.routes';
import { chatRoutes } from './chat/chat.routes';
import { adviceRoutes } from './advice/advice.routes';

export type Env = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_HOST: string;
  ENCRYPTION_KEY: string;
  R2_ENDPOINT: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  AI: Ai;
  KV: KVNamespace;
  R2: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

// Middleware — CORS origins hardcoded, secrets injected via deploy-backend.yml
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://aletaraz.com',
      'https://www.aletaraz.com',
      'https://alexa-mission-frontend.pages.dev',
      'https://alexa-mission-frontend-dev.pages.dev',
      'http://localhost:5173',
    ];
    return allowed.includes(origin) ? origin : '';
  },
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/api/ai', aiRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/predictions', predictionsRoutes);
app.route('/api/revelation', revelationRoutes);
app.route('/api/assets', assetsRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/advice', adviceRoutes);

export default app;
