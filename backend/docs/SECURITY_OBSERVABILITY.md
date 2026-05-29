# Security and Observability

This document describes the authentication model, rate limiting, structured
logging, and metrics guidance for the VaultQuest backend service.

---

## Authentication model

The backend has two distinct identity layers. They are intentionally separate
and must not be conflated.

### Wallet identity (user-scoped endpoints)

Public routes that read or mutate a specific user's data require the caller to
identify itself via the `X-Wallet-Address` header.

```
X-Wallet-Address: GABCDEF…
```

**What this header does:**
- Declares which Stellar wallet is making the request.
- Is checked against the wallet stored on the action record (or the `wallet`
  query parameter) before any data is returned or mutated.
- A mismatch returns `403 FORBIDDEN`. A missing header returns `401 UNAUTHORIZED`.

**What this header does not do:**
- It does not carry a cryptographic signature at the HTTP layer. Signature
  verification happens in the Stellar wallet-connect flow on the frontend
  before the request is sent. The backend trusts the header as a bearer
  identity claim, consistent with how Stellar dApps operate at MVP scale.
- It does not grant access to other wallets' data. Every user-scoped route
  enforces `header wallet === record wallet` before responding.

**Upgrade path:** When the product requires stronger guarantees (e.g. replay
protection, multi-device), add a `X-Wallet-Signature` + `X-Wallet-Timestamp`
pair and verify the signature in `src/middleware/wallet-auth.ts` using the
Stellar SDK's `Keypair.verify` before the ownership check.

### Service identity (internal endpoints)

`POST /internal/reconcile` is the only write path for the off-chain event
indexer. It is authenticated by a shared secret:

```
X-Internal-Secret: <INTERNAL_SERVICE_SECRET>
```

The secret must be at least 20 characters and must not be a placeholder value.
The backend rejects placeholder values at boot. Rotate this secret by updating
the env var and redeploying; no schema change is required.

### Endpoint summary

| Endpoint | Auth required | Ownership check |
|---|---|---|
| `GET /health` | None | — |
| `POST /actions` | `X-Wallet-Address` | header === body `wallet_address` |
| `PATCH /actions/:id/submitted` | `X-Wallet-Address` | header === record wallet |
| `POST /actions/:id/cancel` | `X-Wallet-Address` | header === record wallet |
| `GET /actions/:id` | `X-Wallet-Address` | header === record wallet |
| `GET /actions` | `X-Wallet-Address` | header === query `wallet` |
| `DELETE /actions` | `X-Wallet-Address` | header === query `wallet` |
| `GET /dashboard/summary` | `X-Wallet-Address` | header === query `wallet` |
| `POST /internal/reconcile` | `X-Internal-Secret` | — |

---

## Rate limiting

Rate limiting is applied globally to all routes via `@fastify/rate-limit`.

### Key generator

Requests are bucketed by wallet identity when `X-Wallet-Address` is present,
falling back to the source IP address. This prevents a single wallet from
exhausting the shared IP budget on shared-egress infrastructure (e.g. a
corporate NAT or a mobile carrier).

```
wallet present  →  key = "wallet:<X-Wallet-Address>"
wallet absent   →  key = "ip:<req.ip>"
```

### Configuration

| Env var | Default | Description |
|---|---|---|
| `RATE_LIMIT_MAX` | `100` | Maximum requests per window per key |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window duration in milliseconds |

Tune these values for your deployment. For MVP traffic with wallet-based usage,
100 req/min per wallet is generous. Tighten to 20–30 for write endpoints if
abuse is observed.

### Error response

Rate-limited requests receive `429` with a stable error shape:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "too many requests — retry after 58s",
    "details": { "retry_after_ms": 58000 }
  }
}
```

The frontend should read `details.retry_after_ms` to implement exponential
backoff. Do not auto-retry `RATE_LIMITED` without a delay.

---

## Structured logging

The backend uses [pino](https://getpino.io) for structured JSON logging.

### Log level

Controlled by the `LOG_LEVEL` env var (`fatal | error | warn | info | debug | trace`).
Default is `info`. Use `debug` locally; never use `trace` in production.

### Correlation ID

Every request is assigned a `correlationId` (UUID v4) by the correlation
middleware. The ID is:

- Echoed back in the `Correlation-Id` response header.
- Accepted from the incoming `Correlation-Id` request header (so the frontend
  can propagate its own trace ID).
- Included in every log line emitted during that request's lifecycle.

The frontend should log the `Correlation-Id` from error responses so users can
quote it in support tickets.

### Log fields

Every request log line includes:

| Field | Description |
|---|---|
| `correlationId` | Request trace ID |
| `method` | HTTP method |
| `url` | Request path |
| `wallet` | `X-Wallet-Address` header value (omitted when absent) |
| `statusCode` | HTTP response status (response log only) |
| `responseTime` | Elapsed time in ms (response log only) |

Error log lines additionally include:

| Field | Description |
|---|---|
| `code` | `AppError.code` for known errors |
| `err` | Full error object for unexpected errors |
| `issues` | Zod validation issues for `INVALID_PAYLOAD` errors |

### Diagnosing common failure modes

**Sync lag** — Search logs for `correlationId` values that appear in
`POST /internal/reconcile` but not in a subsequent `GET /actions/:id` with
`status: confirmed`. A gap indicates the reconciler received the event but the
action was not yet in `submitted` state (parked in `pending_events`).

**API failures** — Filter on `statusCode >= 500` and `code: INTERNAL`. The
`err` field contains the full stack trace.

**Malformed requests** — Filter on `code: INVALID_PAYLOAD`. The `issues` field
contains the Zod path and message for each failing field.

**Transaction-status inconsistencies** — Filter on `code: ILLEGAL_TRANSITION`
or `code: TX_HASH_ALREADY_ATTACHED`. These indicate the indexer or frontend
sent a state-change that violated the status machine.

---

## Metrics guidance

The backend does not ship a metrics exporter at MVP. The following signals are
recommended for a first instrumentation pass:

| Metric | Type | Labels | Why |
|---|---|---|---|
| `http_requests_total` | Counter | `method`, `route`, `status_code` | Request volume and error rate |
| `http_request_duration_ms` | Histogram | `method`, `route` | Latency percentiles |
| `rate_limit_hits_total` | Counter | `key_type` (`wallet`/`ip`) | Abuse detection |
| `action_status_transitions_total` | Counter | `from`, `to` | Funnel health |
| `reconciler_sweep_duration_ms` | Histogram | — | Worker lag |
| `orphan_evictions_total` | Counter | — | TTL sweep activity |

Instrument these by adding a `onResponse` hook in `src/app.ts` and a counter
increment in `LedgerService` transition methods. Export via a `/metrics`
endpoint using `prom-client` when ready.

---

## Error shapes

All errors use the envelope defined in `docs/API_RESPONSES.md`. The `code`
field is always a stable string constant from `src/constants.ts`. Frontend
code should branch on `error.code`, not `error.message`.

Security-relevant codes:

| Code | Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing `X-Wallet-Address` or `X-Internal-Secret` |
| `FORBIDDEN` | 403 | Header wallet does not match the requested resource |
| `RATE_LIMITED` | 429 | Request rate exceeded; see `details.retry_after_ms` |
