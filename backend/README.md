# Backend — Ihsan API

Express + MongoDB + Firebase Admin backend for Ihsan.

## Current Simplified Zikr Model

(Interim step while resetting database) — Only lifetime totals are exposed via API.

### Collections

- users: `totalCount`, `zikrTotals` (per-type), `zikrTypes`
- (Optional for future) zikrdailies retained but not used in UI

### Endpoints (active)

- POST /api/zikr/increment
- GET /api/zikr/summary
- GET /api/zikr/types
- POST /api/zikr/type

Daily / stats aggregation is temporarily removed to keep logic simple while reseeding data.

Add back advanced analytics later by reintroducing a /stats endpoint aggregating `zikrdailies`.
