# API response standard

Backend HTTP responses use one envelope so frontend code can parse success,
validation, and recovery states without route-specific branching.

## Success

Single-object responses:

```json
{
  "data": {
    "id": "act_123",
    "status": "pending"
  }
}
```

List responses:

```json
{
  "data": [{ "id": "act_123" }],
  "meta": {
    "pagination": {
      "next_cursor": "4f2b9a1d-...",
      "limit": 25,
      "has_more": true
    }
  }
}
```

`next_cursor: null` and `has_more: false` mean the client has reached the end.
Clients should pass the returned cursor back as `?cursor=` unchanged.

## Errors

All errors use:

```json
{
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "validation failed",
    "details": "optional route-specific context",
    "issues": []
  }
}
```

Representative status codes:

| Status | Code | Meaning |
|---|---|---|
| 400 | `INVALID_PAYLOAD` | Request body, query string, or required header failed validation |
| 401 | `UNAUTHORIZED` | Missing or invalid internal service secret |
| 404 | `NOT_FOUND` | Requested action does not exist |
| 409 | `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`, `TX_HASH_ALREADY_ATTACHED`, `ILLEGAL_TRANSITION` | Retry or state conflict |
| 500 | `INTERNAL` | Unexpected backend failure |

Validation responses include Zod `issues`; frontend code should prefer
`error.message` for general copy and field-specific `issues` when rendering
forms.

## Network and upstream failures

Backend routes that cannot reach Stellar RPC, Horizon, Prisma, or another
upstream should return `NETWORK_ERROR` when the failure is expected/recoverable.
Unknown exceptions fall back to `INTERNAL`. Frontends may retry `NETWORK_ERROR`
with backoff; do not auto-retry validation, auth, or conflict errors.
