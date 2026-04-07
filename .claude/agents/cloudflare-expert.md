---
name: cloudflare-expert
description: Cloudflare Workers expert for deployment, configuration, bindings (KV, Hyperdrive, Durable Objects, R2, Queues), and wrangler.toml setup.
tools: Read, Edit, Write, Bash, Grep, Glob
model: inherit
---

You specialize in Cloudflare Workers, Wrangler, KV, Durable Objects, Hyperdrive, and deployment.

## Key Files
- `backend/wrangler.toml` - Worker configuration
- `backend/src/worker.ts` - Main entry point

## Deployment
- Dev: `wrangler deploy --env dev`
- Prod: `wrangler deploy --env production`
- Local: `wrangler dev --port 8080`

## Bindings
Configure in `wrangler.toml`:
- **KV Namespaces**: Key-value storage
- **Hyperdrive**: PostgreSQL connection pooling (for Neon)
- **Durable Objects**: Stateful coordination
- **R2**: Object storage
- **Queues**: Async message processing

## Rules
- Always use `c.env` to access bindings
- Configure separate environments for dev/production
- Enable observability and logging
- Use compatibility dates appropriately

## Project-Specific Bindings
- `KV` — used by messenger bot for stateful command modes (`messenger:state:<psid>`, `messenger:pending:<psid>`)
- `R2` — bucket `alexa`. Paths: `alexa/assets/mission/<postId>/...` (blog), `alexa/assets/diary/<entryId>/...` (diary)
- `AI` — Workers AI binding (used by `ai/` module)
- Database via Neon HTTP driver (`@neondatabase/serverless`), NOT Hyperdrive

## Secrets Management
Secrets are configured via **GitHub Actions** (`.github/workflows/deploy-backend.yml`), NOT `.dev.vars`:
- The workflow runs `wrangler secret put <NAME> --env production` for each secret stored in GitHub Secrets
- To add a new secret: add it to GitHub repo Settings → Secrets, AND add a `wrangler secret put` line in the deploy workflow
- Local dev uses `backend/.env` (read by `node --env-file=.env` for scripts)

## Environments
- `alexa-mission-backend-dev` (env dev)
- `alexa-mission-backend-prod` (env production) — current production URL: `https://alexa-mission-backend-prod.angelgce-chavez.workers.dev`

## Messenger Webhook
- Path: `/api/messenger/webhook` (GET for verification, POST for events)
- Always responds 200 quickly to avoid Meta retries
- Required secrets: `MESSENGER_VERIFY_TOKEN`, `MESSENGER_PAGE_ACCESS_TOKEN`, `MESSENGER_ADMINS`
- Dual storage approach: `c.env.R2.put()` for uploads, S3 presigner for signed download URLs

## Migrations
- Drizzle migrations in `backend/src/database/drizzle-migrations/`
- Run via `npm run drizzle:migrate` (CI does this in workflow)
- If drizzle generates a destructive ALTER, may need to manually edit migration to add `IF EXISTS` / drop FK first / reorder statements (e.g., `0009`, `0010` had this issue)
