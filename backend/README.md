# Backend — Ihsan API

Express + TypeScript + Mongoose (MongoDB Atlas) + Firebase Admin backend for Ihsan.

See the root [`CLAUDE.md`](../CLAUDE.md) for the full architecture, conventions, and environment variable reference — this file only covers what's specific to running and testing the backend in isolation.

## Running

```bash
npm run dev          # ts-node-dev, port 5000 (see .env)
npm test             # Jest + mongodb-memory-server, no real DB needed
npm run typecheck    # tsc --noEmit
npm run build        # compile to dist/
```

## Layout

```
src/
├── routes/       Routing only — registers middleware + controller handlers
├── controllers/  Request/response handling, calls services, never touches the DB directly
├── services/     Business logic + all DB queries
├── middleware/   auth, validate (Zod), rateLimiter, errorHandler
├── models/       Mongoose schemas + interfaces
├── config/       mongo.ts, firebaseAdmin.ts
├── utils/        timezone-flexible.ts is the canonical timezone util
├── validation/   Zod schemas, one file per domain
└── jobs/         dailyCron.ts
```

## Domains

Ten route modules, each following the same routes → controllers → services layering: `auth`, `zikr`, `salat`, `fasting`, `quran`, `cycle` (Rayhanah), `social` (friends/Noor), `analytics`, `ai` (Naseeh, Groq-backed), `user`.

## Tests

`tests/*.e2e.test.js` — one file per domain, each spinning up its own `mongodb-memory-server` instance (no shared state between files, no real database needed to run the suite). Run the whole suite with `npm test`, or a single file with e.g. `npx jest tests/social.e2e.test.js`.

## Deployment

Deploys to Vercel as a serverless function alongside the frontend (same deployment, same origin — see `CLAUDE.md`). `MONGODB_URI` in production points at the live Atlas cluster; there is currently no separate staging database, so exercise care when testing against a deployed environment with a real account.
