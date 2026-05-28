# Admin pause and recovery behavior

VaultQuest pause controls are for incident response: protect user funds,
preserve readable state, and give frontend/backend services a predictable mode
while maintainers recover.

## Contract expectations

When paused, read-only methods remain available. State-changing user actions
return a paused error before moving funds or changing pool state.

| Action | Paused behavior |
|---|---|
| `create` | Blocked |
| `join` | Blocked |
| `drip` | Blocked |
| `claim` | Blocked unless maintainers explicitly enable emergency claims |
| `withdraw` | Blocked by default; emergency withdrawals are a follow-up contract feature |
| admin config changes | Allowed only for recovery-safe settings |
| `pause` | Idempotent; emits `paused` |
| `recover` / `unpause` | Admin-only; emits `recovered` |

Follow-up implementation gaps for the current scaffold:

- Add persisted paused state and admin authorization to the contract.
- Add explicit paused errors for `create`, `join`, `drip`, `claim`, and
  `withdraw`.
- Decide whether emergency withdrawals/claims should be separate admin-enabled
  modes.

## Frontend behavior

During pause, disable create, join, drip, claim, and withdraw controls. Reads,
pool detail pages, balances, and reward history stay visible.

Suggested user-facing copy:

- Banner title: `VaultQuest is temporarily paused`
- Body: `Pool actions are disabled while maintainers complete recovery. Your balances and history remain visible.`
- Button/tooltips: `Action unavailable during pause`

After recovery, remove the banner, re-enable actions, and refresh pool and
position data.

## Backend and indexer behavior

Indexers must continue ingesting events while paused, especially `paused`,
`recovered`, `config_changed`, and any late settlement events. Backend reads
remain available. Mutation endpoints may accept frontend intents, but should
mark or reject paused actions consistently once the contract exposes a canonical
paused error.

Operational recovery:

1. Admin emits `paused` with a short reason.
2. Frontend/backend surface paused state and keep reads live.
3. Maintainers patch configuration or deploy the contract fix.
4. Admin emits `recovered`.
5. Indexer confirms `recovered`; backend clears paused state; frontend refreshes
   and re-enables actions.
