# Ihsan Backend

Express.js + MongoDB + Firebase Admin + optional OpenAI.

Scripts

- npm run dev — start dev server with nodemon
- npm start — start production server

Environment variables
See .env.example

API

- GET /api/health — health check
- POST /api/auth/verify — verify Firebase ID token, upsert user
- GET /api/auth/me?uid=... — get user by uid
- POST /api/zikr/session — save zikr session { userId, date, zikrType, count }
- GET /api/zikr/stats?userId=...&range=7d|30d|all — stats aggregation
- GET /api/zikr/types?userId=... — preset + user types
- POST /api/zikr/type — add custom type { userId, name }
- POST /api/ai/suggest — returns dhikr suggestions and a motivational line (uses OpenAI if configured)
