# Drip Wave

Drip Wave is a prize-linked savings and recurring contribution product being rebuilt for the Stellar network with Soroban smart contracts.

This repository still contains legacy `VaultQuest` frontend and EVM/Cosmos-era code paths. The current development goal is to migrate the product into a clean Stellar/Soroban architecture with a stable wallet flow, explicit core product logic, and production-ready smart contracts.

## Current Focus

The implementation roadmap in this repository is centered on three primary workstreams:

1. Stellar wallet connection and transaction signing.
2. Core Drip Wave product logic for pool participation, recurring contributions, payouts, and recovery states.
3. Soroban smart contract design, implementation, deployment, and testing.

Supporting workstreams cover backend event syncing and GitHub quality automation where they directly unblock the three priorities above.

## Product Direction

Drip Wave is intended to provide a no-loss or capital-preserving contribution experience where users participate in shared pools and interact with on-chain rules for deposits, payout eligibility, claims, and withdrawals.

The exact contract and frontend boundaries are being normalized during the Stellar migration. Contributors should treat the current repository as a transition codebase, not as a finished architectural reference.

## Why Stellar And Soroban

- Stellar provides fast settlement and strong support for asset movement and payment-centric applications.
- Soroban gives Drip Wave a smart-contract environment that can encode pool rules, user positions, payout logic, and event emission on-chain.
- A Stellar-native wallet flow is required; the current Cosmos/EVM wallet setup is legacy and should be phased out of active implementation.

## Repository Status

Today the repository includes:

- A Next.js frontend prototype with legacy `VaultQuest` branding in several routes and components.
- Legacy wallet integrations built around Cosmos Kit, RainbowKit, and `wagmi`.
- A Solidity contract and ABI that document prior assumptions but do not match the target Soroban implementation.
- No committed `.github` automation baseline before this project-management pass.

That means contributors working on new implementation should align with the GitHub issues for the Stellar migration rather than extending the old chain-specific paths.

## Target Architecture

The intended architecture is:

1. `frontend`
   A Next.js application for connect wallet, pool discovery, contribution flows, dashboard views, transaction progress, and recovery UX.
2. `soroban contracts`
   Rust/Soroban contracts that define pool state, participant accounting, payout rules, admin controls, and events.
3. `backend/indexer`
   Supporting services that ingest contract events, track transaction status, and serve dashboard-friendly reads.

## Priority Implementation Order

1. Replace the current wallet stack with a Stellar-native provider and connection flow.
2. Define the core Drip Wave state model used across frontend, backend, and contract work.
3. Specify and implement the Soroban contract architecture and lifecycle.
4. Add deployment/config tooling so the frontend and backend can target real contract IDs.
5. Build indexing, dashboard APIs, and quality automation around the core flow.

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Install

```sh
npm install
```

### Run The Frontend

```sh
npm run dev
```

### Build

```sh
npm run build
```

## Contributor Guidance

- Start from the GitHub issues created for the Stellar/Soroban migration.
- Do not extend the legacy EVM/Cosmos wallet path for new features.
- Keep wallet logic, product logic, and contract logic separated by clear interfaces.
- UI-related pull requests must include screenshots or a short demo video/GIF.
- Keep README, issue bodies, and implementation notes aligned with `Drip Wave`, `Stellar`, and `Soroban` terminology.

Additional contributor workflow guidance lives in [CONTRIBUTING.md](CONTRIBUTING.md).

## Near-Term Cleanup Targets

- Replace legacy `VaultQuest` branding in user-facing routes and metadata.
- Remove or isolate `wagmi`, RainbowKit, Cosmos Kit, and Solidity-specific assumptions from active flows.
- Introduce Soroban contract source, tests, and deployment configuration.
- Add backend event indexing and dashboard APIs that match the new state model.

## License

This project is licensed under the MIT License.
