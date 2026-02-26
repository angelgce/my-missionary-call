import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/drizzle-schema/**/*.schema.ts',
  out: './src/database/drizzle-migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
