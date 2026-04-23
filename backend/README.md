# VaultQuest Backend

Action ledger and reconciliation service for Drip Wave (issue #34).

## Stack

- Node 20 + TypeScript
- Fastify 4 (HTTP)
- Prisma 5 + Postgres 16 (storage)
- Zod (validation)
- Pino (logging)
- node-cron (orphan sweep)
- Vitest + Testcontainers (tests against real Postgres)

## Setup

```bash
cp .env.example .env
pnpm install
pnpm exec prisma migrate deploy
pnpm test
pnpm dev
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | /health | Liveness probe |
| POST | /actions | Create intent (requires `Idempotency-Key: <uuid>`) |
| PATCH | /actions/:id/submitted | Attach `tx_hash` after wallet broadcasts |
| POST | /actions/:id/cancel | Mark a pending intent failed |
| GET  | /actions/:id | Read a single action |
| GET  | /actions?wallet=G...&status=&cursor=&limit= | Paginated list |
| DELETE | /actions?wallet=G... | Privacy scrub (nulls payload, sets redacted_at) |
| POST | /internal/reconcile | Event indexer → ledger (requires `X-Internal-Secret`) |

See `docs/superpowers/specs/2026-04-23-action-ledger-design.md` for the full contract.

## Environment

See `.env.example`. All values are validated at boot via Zod.

## Tests

Tests use Testcontainers to spin up Postgres 16 per run. Docker must be available.

```bash
pnpm test
```
