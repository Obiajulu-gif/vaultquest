# VaultQuest API Contract Reference

Developer-facing reference for the VaultQuest backend REST API. Covers pool
actions, dashboard summary, saved-pools watchlist, and activity export.
Frontend contributors can build UI integrations against these shapes without
reading the backend source.

All responses use `application/json` unless noted. Successful responses wrap
data in `{ "data": ... }`. Paginated responses include a `meta.pagination`
block. Errors return `{ "error": { "code": "...", "message": "..." } }`.

---

## Authentication

There is no session-based auth. Wallet-scoped endpoints accept the connected
wallet address as a query parameter. The frontend is responsible for passing
the user's own address — the API trusts this parameter.

---

## Endpoints

### Actions

#### POST /actions

Create a new wallet action intent.

**Headers**

| Header | Required | Description |
|---|---|---|
| `Idempotency-Key` | Yes | UUID v4. Reusing the same key with the same payload is a safe no-op (returns 200). Reusing with a different payload returns 409. |

**Request body**

```json
{
  "wallet_address": "GABCDEF1234567890",
  "action_type": "deposit",
  "action_payload": {
    "vault_id": "42",
    "amount": "1000000",
    "token": "USDC"
  }
}
```

| Field | Type | Values |
|---|---|---|
| `wallet_address` | string | Stellar wallet address (max 120 chars) |
| `action_type` | enum | `deposit` `withdraw` `create_vault` `claim` `select_winner` |
| `action_payload` | object | Arbitrary JSON; shape depends on `action_type` |

**Response — 201 Created** (new action) or **200 OK** (idempotent replay)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "idempotency_key": "a4e8b0c2-...",
    "wallet_address": "GABCDEF1234567890",
    "action_type": "deposit",
    "action_payload": { "vault_id": "42", "amount": "1000000", "token": "USDC" },
    "status": "pending",
    "tx_hash": null,
    "soroban_event_id": null,
    "correlation_id": "...",
    "error_code": null,
    "error_detail": null,
    "retry_count": 0,
    "created_at": "2025-05-29T12:00:00.000Z",
    "updated_at": "2025-05-29T12:00:00.000Z",
    "submitted_at": null,
    "confirmed_at": null,
    "redacted_at": null
  }
}
```

---

#### GET /actions

List actions for a wallet, newest first.

**Query parameters**

| Param | Required | Default | Description |
|---|---|---|---|
| `wallet` | Yes | — | Wallet address |
| `status` | No | — | Filter: `pending` `submitted` `confirmed` `failed` `reverted` `orphaned` |
| `cursor` | No | — | UUID of the last item from the previous page |
| `limit` | No | 25 | Items per page (1–100) |

**Response — 200 OK**

```json
{
  "data": [ /* array of action objects */ ],
  "meta": {
    "pagination": {
      "next_cursor": "550e8400-...",
      "limit": 25,
      "has_more": true
    }
  }
}
```

---

#### GET /actions/:id

Get a single action by ID.

**Response — 200 OK** — action object (same shape as POST response)

**Response — 404 Not Found**

```json
{ "error": { "code": "NOT_FOUND", "message": "action <id> not found" } }
```

---

#### PATCH /actions/:id/submitted

Attach a transaction hash after the wallet has broadcast to the network.
Advances status from `pending` → `submitted`.

**Request body**

```json
{ "tx_hash": "abc123..." }
```

**Response — 200 OK** — updated action object

---

#### POST /actions/:id/cancel

Cancel a pending action (e.g. user rejected the wallet prompt).
Advances status from `pending` → `failed`.

**Request body**

```json
{
  "error_code": "WALLET_REJECTED",
  "error_detail": "User dismissed the wallet popup"
}
```

| `error_code` values | Meaning |
|---|---|
| `WALLET_REJECTED` | User explicitly rejected the signing request |
| `WALLET_TIMEOUT` | Signing timed out with no response |
| `NETWORK_ERROR` | Could not reach the RPC endpoint |

**Response — 200 OK** — updated action object

---

#### DELETE /actions?wallet=...

Scrub all personal data for a wallet (GDPR / right-to-erasure). Sets
`action_payload` to null and stamps `redacted_at` on all rows.
Scrubbed rows are excluded from future export responses.

**Response — 200 OK**

```json
{ "data": { "scrubbed": 12 } }
```

---

#### GET /actions/export

Export the wallet's full activity history as JSON or CSV.

**Query parameters**

| Param | Required | Default | Description |
|---|---|---|---|
| `wallet` | Yes | — | Wallet address |
| `format` | No | `json` | `json` or `csv` |
| `from` | No | — | ISO 8601 datetime — return actions created at or after this time |
| `to` | No | — | ISO 8601 datetime — return actions created at or before this time |
| `limit` | No | 500 | Max rows returned (1–1000) |

**Response — 200 OK (JSON format)**

```json
{
  "data": [
    {
      "id": "550e8400-...",
      "wallet_address": "GABCDEF1234567890",
      "action_type": "deposit",
      "action_payload": { "vault_id": "42", "amount": "1000000", "token": "USDC" },
      "status": "confirmed",
      "tx_hash": "abc123...",
      "error_code": null,
      "created_at": "2025-05-29T12:00:00.000Z",
      "submitted_at": "2025-05-29T12:00:05.000Z",
      "confirmed_at": "2025-05-29T12:00:30.000Z"
    }
  ]
}
```

**Response — 200 OK (CSV format)**

Returns `Content-Type: text/csv` with `Content-Disposition: attachment; filename="vaultquest-activity-<wallet-prefix>.csv"`.

```
"id","date","action_type","pool_id","amount","token","status","tx_hash","error_code","submitted_at","confirmed_at"
"550e8400-...","2025-05-29T12:00:00.000Z","deposit","42","1000000","USDC","confirmed","abc123...","","2025-05-29T12:00:05.000Z","2025-05-29T12:00:30.000Z"
```

**Notes**
- Scrubbed rows (`redacted_at != null`) are never included in export output.
- Large histories: use `from`/`to` date ranges to paginate manually. The `limit`
  cap is 1 000 rows per request.
- Wallet-scoping: the export only returns data for the `wallet` parameter value.
  Never returns another user's data.

---

### Portfolio / Dashboard

#### GET /dashboard/summary

Aggregated dashboard rollup for a wallet. Provides per-status action counts,
in-flight tx hashes the wallet should keep polling, and a freshness flag.

**Query parameters**

| Param | Required | Default | Description |
|---|---|---|---|
| `wallet` | Yes | — | Wallet address |
| `stale_after_ms` | No | 300 000 (5 min) | If the most recent ledger update is older than this, `is_stale` is true |

**Response — 200 OK**

```json
{
  "data": {
    "wallet_address": "GABCDEF1234567890",
    "total_actions": 14,
    "by_status": {
      "pending": 0,
      "submitted": 1,
      "confirmed": 11,
      "failed": 1,
      "reverted": 1,
      "orphaned": 0
    },
    "pending_tx_hashes": ["abc123..."],
    "is_stale": false,
    "latest_activity_at": "2025-05-29T12:00:00.000Z",
    "latest_confirmed_at": "2025-05-29T11:55:00.000Z"
  }
}
```

---

### Saved pools / watchlist

#### GET /saved-pools

Return the saved pools for a wallet, newest first.

**Query parameters**

| Param | Required | Default | Description |
|---|---|---|---|
| `wallet` | Yes | — | Wallet address |

**Response — 200 OK**

```json
{
  "data": [
    {
      "id": "550e8400-...",
      "wallet_address": "GABCDEF1234567890",
      "pool_id": "pool-42",
      "pool_name": "Weekly USDC",
      "status": "open",
      "tvl": "12500.5",
      "asset": "USDC",
      "participant_count": 24,
      "expected_yield": "5.2% APY",
      "prize": "50 USDC",
      "opens_at": "2026-05-29T12:00:00.000Z",
      "locks_at": "2026-06-05T12:00:00.000Z",
      "draws_at": "2026-06-12T12:00:00.000Z",
      "created_at": "2026-05-29T12:00:00.000Z",
      "updated_at": "2026-05-29T12:00:00.000Z"
    }
  ]
}
```

#### POST /saved-pools

Create or update a saved pool entry for a wallet. Reusing the same wallet and
pool ID updates the stored summary instead of creating duplicates.

**Request body**

```json
{
  "wallet_address": "GABCDEF1234567890",
  "pool": {
    "pool_id": "pool-42",
    "pool_name": "Weekly USDC",
    "status": "open",
    "tvl": "12500.5",
    "asset": "USDC",
    "participant_count": 24,
    "expected_yield": "5.2% APY",
    "prize": "50 USDC",
    "opens_at": "2026-05-29T12:00:00.000Z",
    "locks_at": "2026-06-05T12:00:00.000Z",
    "draws_at": "2026-06-12T12:00:00.000Z"
  }
}
```

**Response — 201 Created** for a new saved pool, or **200 OK** when updating an existing entry

```json
{
  "data": {
    "saved": {
      "id": "550e8400-...",
      "wallet_address": "GABCDEF1234567890",
      "pool_id": "pool-42",
      "pool_name": "Weekly USDC",
      "status": "open",
      "tvl": "12500.5",
      "asset": "USDC",
      "participant_count": 24,
      "expected_yield": "5.2% APY",
      "prize": "50 USDC",
      "opens_at": "2026-05-29T12:00:00.000Z",
      "locks_at": "2026-06-05T12:00:00.000Z",
      "draws_at": "2026-06-12T12:00:00.000Z",
      "created_at": "2026-05-29T12:00:00.000Z",
      "updated_at": "2026-05-29T12:00:00.000Z"
    }
  }
}
```

#### DELETE /saved-pools/:poolId

Remove a saved pool entry for the wallet supplied in the query string.

**Query parameters**

| Param | Required | Default | Description |
|---|---|---|---|
| `wallet` | Yes | — | Wallet address |

**Response — 200 OK**

```json
{ "data": { "deleted": 1 } }
```

---

## Standard errors

| Code | HTTP | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Resource does not exist |
| `INVALID_PAYLOAD` | 400 | Request body or query params failed validation |
| `ILLEGAL_TRANSITION` | 409 | Status transition is not allowed (e.g. cancel a confirmed action) |
| `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD` | 409 | Same `Idempotency-Key` used with a different body |
| `TX_HASH_ALREADY_ATTACHED` | 409 | `tx_hash` is already owned by another action |
| `UNAUTHORIZED` | 401 | Request lacks required credentials (internal endpoints) |

---

## Action status lifecycle

```
pending ──► submitted ──► confirmed
   │               └──────► reverted
   └──────────────────────► failed
submitted ────────────────► orphaned
```

Terminal states (no further transitions): `confirmed`, `failed`, `reverted`, `orphaned`.

---

## Action payload shapes by type

| `action_type` | Payload fields |
|---|---|
| `deposit` | `vault_id`, `amount`, `token` |
| `withdraw` | `vault_id`, `amount`, `token` |
| `create_vault` | `vault_id`, `amount`, `token` |
| `claim` | `vault_id` |
| `select_winner` | `vault_id` |

The `action_payload` is stored verbatim and surfaced as-is in responses and
exports. Consumers should treat unknown fields as additive and not error on them.
