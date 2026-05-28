# Transaction Status API — frontend integration & retry guide

How the frontend should submit actions, poll status, and retry safely against
the action-ledger service (#72). Every flow here is idempotent, so a dropped
response, a double click, or a reconnect never creates duplicate records.

## Status lifecycle

```
pending ──attach tx_hash──▶ submitted ──indexer event──▶ confirmed
   │                              │                       reverted
   └──cancel──▶ failed            └────────(TTL)─────────▶ orphaned
```

Terminal states: `confirmed`, `reverted`, `failed`, `orphaned`. Only `pending`
and `submitted` are still in flight.

## 1. Create the intent (idempotent)

`POST /actions` with an **`Idempotency-Key: <uuid>`** header. Generate the UUID
once per user intent and reuse it for every retry of that same intent.

- New key → `201 Created`.
- Same key + identical payload → `200 OK` with the original record (safe retry).
- Same key + **different** payload → `409` `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.

```ts
const key = crypto.randomUUID(); // persist this with the pending intent
await fetch("/actions", {
  method: "POST",
  headers: { "content-type": "application/json", "idempotency-key": key },
  body: JSON.stringify({ wallet_address, action_type, action_payload }),
});
```

## 2. Attach the tx hash after broadcast (retry-safe)

After the wallet signs and broadcasts, `PATCH /actions/:id/submitted` with
`{ tx_hash }`.

- First call: `pending → submitted`.
- Re-sending the **same** `tx_hash` to the **same** action is a no-op and
  returns the current record — so retrying after a lost response is safe.
- A `tx_hash` already attached to a **different** action → `409`
  `TX_HASH_ALREADY_ATTACHED` (one action per on-chain hash).
- Attaching to a non-pending action with a different hash → `409`
  `ILLEGAL_TRANSITION`.

## 3. Poll status (no duplicate records)

`GET /actions/:id` is read-only — polling never creates or mutates records.
Poll until the status is terminal, then stop. Recommended: short backoff
(e.g. 2s → 5s → 10s, cap ~30s).

If the indexer confirms a tx before the frontend attaches it (out-of-order),
the confirmation is parked and applied automatically on attach, so the action
can jump straight to `confirmed`.

## 4. Resume in-flight work after reload

On dashboard load, call `GET /dashboard/summary?wallet=G...`. Use
`pending_tx_hashes` to resume polling for still-submitted transactions and
`is_stale` to show a "data may be stale" banner without hitting the indexer
directly.

## Error handling cheat-sheet

| Code | Meaning | Frontend action |
|---|---|---|
| `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD` | Key reused with a changed payload | Generate a fresh key for the new intent |
| `TX_HASH_ALREADY_ATTACHED` | Hash already owned by another action | Treat as already-submitted; poll the existing action |
| `ILLEGAL_TRANSITION` | Action not in a state that allows the call | Re-read with `GET /actions/:id` and reconcile UI |
| `NOT_FOUND` | Unknown action id | Re-create the intent |

**Rule of thumb:** reuse the idempotency key and the tx hash across retries;
never mint new ones just to "try again."
