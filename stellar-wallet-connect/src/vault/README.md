# Vault pool UI module

Pool-level UI for VaultQuest plus a testable contract seam.

| Piece | Issue | What it is |
|---|---|---|
| `components/PoolDetail.tsx` | #73 | Pool overview, user position, and state-aware actions |
| `components/RewardHistory.tsx` | #75 | Completed-cycle reward history (table/cards) |
| `contract/` | #67 | `VaultContractClient` interface + in-memory mock |
| `hooks.ts` | #73 / #75 | `usePoolDetail` / `useRewardHistory` data adapters |
| `lib/format.ts` | #73 / #75 | Address truncation, amount/date formatting, explorer links |

All states (loading, empty, stale, error, wallet-disconnected) reuse the shared
`components/FallbackStates` from #61, and wallet references render truncated.

## Contract-interface mock strategy (#67)

UI code depends only on the `VaultContractClient` interface — never on a live
Stellar connection. Tests inject `createMockVaultClient(config)`, which lets
wallet-driven flows (create / join / drip / claim / withdraw) and their reads
run with no network.

```ts
import { createMockVaultClient } from "./contract/mockClient";

// Happy path
const client = createMockVaultClient({
  connected: true,
  pools: { "pool-1": myPool },
  positions: { "pool-1": myPosition },
  rewardHistory: [myRewardRow],
});

// Failure injection — one case per error the UI must recover from
createMockVaultClient({ connected: false });                       // wallet_disconnected
createMockVaultClient({ failActions: { join: "signature_rejected" } });
createMockVaultClient({ failActions: { withdraw: "rpc_failure" } });
createMockVaultClient({ failActions: { claim: "contract_error" } });
createMockVaultClient({ failReads: "stale_data" });                // reads throw stale
```

Every failure surfaces as a `ContractInterfaceError` whose `kind` is one of:
`wallet_disconnected`, `signature_rejected`, `rpc_failure`, `contract_error`,
`stale_data`. Components map these to the matching fallback UI.

### Adding a new mock case

1. If you need a new read/write, add it to `VaultContractClient` in
   `contract/types.ts` so the real and mock clients stay aligned.
2. Implement it in `contract/mockClient.ts`, honouring `failReads` /
   `failActions` so error states stay injectable.
3. Add a test in `contract/mockClient.test.ts` covering success **and** at
   least one failure kind.

## Running the tests

From `stellar-wallet-connect/`:

```bash
npm install
npm test          # vitest run (jsdom)
npm run typecheck  # tsc --noEmit
```

No Stellar wallet, RPC, or network is required.
