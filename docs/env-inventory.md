# Environment Variable Inventory

Reference for configuration used by the VaultQuest frontend.

## Classification

| Class | Prefix / location | Exposed to browser? | Committed? |
|-------|-------------------|---------------------|------------|
| Public frontend config | `NEXT_PUBLIC_*` in `.env.local` | Yes — inlined into the browser bundle at build time | No — `.env.local` is git-ignored |

Anything without the `NEXT_PUBLIC_` prefix is server-only and must never be
referenced in frontend code. If it has `NEXT_PUBLIC_`, assume anyone who loads
the site can read it.

## Frontend variables

Copy `.env.example` to `.env.local` before running `npm run dev`.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect / RainbowKit project ID. Get one free at [cloud.walletconnect.com](https://cloud.walletconnect.com). |
| `NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE` | Yes | Stellar network passphrase used by the wallet module. |
| `NEXT_PUBLIC_HORIZON_URL` | Yes | Horizon RPC endpoint used for account lookups and network state. |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Yes | Soroban RPC endpoint used for contract reads and transactions. |
| `NEXT_PUBLIC_DRIP_POOL_CONTRACT_ID` | Yes | Deployed Soroban contract ID for the drip pool. |
| `NEXT_PUBLIC_TRUSTLESS_WORK_ESCROW_CONTRACT_ID` | No | Optional Trustless Work escrow contract address. |
| `TRUSTLESS_WORK_API_BASE_URL` | No | Optional server-side Trustless Work API URL. |
| `TRUSTLESS_WORK_API_KEY` | No | Optional server-side Trustless Work API key. Keep this secret out of browser bundles.

Validation lives in `stellar-wallet-connect/src/core/env.ts`. The wallet module now fails at startup with a clear error message if required values are missing, invalid, or still set to placeholders such as `YOUR_PROJECT_ID` or `CA_PLACEHOLDER_DRIP_POOL_CONTRACT_ID`.

## Backend variables

The backend uses `backend/.env.example` as its canonical example. These values are consumed by `backend/src/env.ts`.

| Variable | Purpose | Required? |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Yes |
| `INTERNAL_SERVICE_SECRET` | Shared secret between event indexer (#13) and `/internal/reconcile` | Yes |
| `ORPHAN_TTL_MINUTES` | Minutes after which `submitted` rows with no event are orphaned | Default 10 |
| `LOG_LEVEL` | Pino log level | Default `info` |
| `PORT` | HTTP port | Default 3001 |

`INTERNAL_SERVICE_SECRET` is now validated to reject placeholder text and must be a custom, strong secret at runtime.

## Indexer integration

The backend and any external indexer share the same authentication boundary:

- `INTERNAL_SERVICE_SECRET` — used to authenticate calls to `POST /internal/reconcile`.
- `DATABASE_URL` is backend-only; the indexer should never have direct database access.

If you are building a separate indexer service, keep its environment aligned with the backend secret and endpoint configuration.

## Per-environment setup

| Environment | Frontend | Backend | Indexer |
|-------------|----------|---------|---------|
| Local dev | Copy `.env.example` → `.env.local` and fill in the required `NEXT_PUBLIC_*` values. | Copy `backend/.env.example` → `backend/.env` and set a local Postgres URL + strong `INTERNAL_SERVICE_SECRET`. | Reuse `INTERNAL_SERVICE_SECRET` from backend for local reconciliation. |
| Preview / staging | Set real `NEXT_PUBLIC_*` values in the preview host. Use separate WalletConnect and contract IDs from production if needed. | Use staging database and a staging `INTERNAL_SERVICE_SECRET`. | Use the same staging `INTERNAL_SERVICE_SECRET` and backend URL. |
| Production | Set production `NEXT_PUBLIC_*` values, live contract IDs, and production Horizon/Soroban endpoints. | Use production database, secure secret, and TLS. | Use production secret and secure backend endpoint. |

## CI placeholder guard

`.github/workflows/config-guard.yml` fails any pull request that commits the
literal string `YOUR_PROJECT_ID` in a JS/TS source file. This prevents the old
placeholder from silently sneaking back into the codebase.

| Environment | Setup |
|-------------|-------|
| Local dev | Copy `.env.example` → `.env.local`, fill in your WalletConnect project ID. |
| CI builds | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is provided by `.github/workflows/frontend.yml` from a repo secret (falls back to a non-placeholder string so the build passes). |
| Preview / production | Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` as a secret in the hosting provider (Vercel, etc.). Use a separate WalletConnect project per environment if you want isolated analytics. |

## CI placeholder guard

`.github/workflows/config-guard.yml` fails any pull request that commits the
literal string `YOUR_PROJECT_ID` in a JS/TS source file. This prevents the old
placeholder from silently sneaking back into the codebase.

## Backend (issue #34 — action ledger)

These are consumed by `backend/src/env.ts`.

| Variable | Purpose | Required? |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Yes |
| `INTERNAL_SERVICE_SECRET` | Shared secret between event indexer (#13) and `/internal/reconcile` | Yes |
| `ORPHAN_TTL_MINUTES` | Minutes after which `submitted` rows with no event are orphaned | Default 10 |
| `LOG_LEVEL` | Pino log level | Default `info` |
| `PORT` | HTTP port | Default 3001 |

