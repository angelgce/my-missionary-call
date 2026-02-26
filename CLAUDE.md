# Project Template

## Stack
- **Backend**: Hono + Cloudflare Workers + Drizzle ORM + Neon PostgreSQL
- **Frontend**: React 18 + Vite + Redux Toolkit + Tailwind CSS + TypeScript

## Architecture

### Backend (Hono)
- **Pattern**: Routes → Services → Repositories
  - Routes: HTTP handlers + Zod validation. NO SQL, NO business logic.
  - Services: Business logic. NO SQL queries.
  - Repositories: SQL queries ONLY (Drizzle ORM).
- Entry point: `backend/src/worker.ts`
- DB schemas: `backend/src/database/drizzle-schema/*.schema.ts`

### Frontend (React + Vite)
- **Structure**: `src/core/` (shared), `src/modules/` (features), `src/shared/` (components)
- **Component structure** (8 sections in order):
  1. Local state
  2. Redux selectors
  3. Custom hooks
  4. Computed values
  5. Effects
  6. Event handlers
  7. Render helpers
  8. Main render

### Responsive Design
- 3 breakpoints ONLY: mobile (base), `tablet:` (768px), `desktop:` (1280px)
- NEVER use sm, md, lg, xl, 2xl

### Import Order
1. React & Hooks
2. External Libraries
3. Core & Store
4. Utils & Services
5. Components
6. Constants & Types
7. Custom Hooks

## Rules
- NEVER create files/services without explicit request
- Use specialized agents for domain-specific tasks
- NO gradients - use solid colors or rgba
- Extract complex logic to custom hooks
- Keep components focused and single-responsibility
