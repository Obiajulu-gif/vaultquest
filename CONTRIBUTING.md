# Contributing To Drip Wave

This repository is in active migration from a legacy `VaultQuest` prototype to a Stellar/Soroban implementation of `Drip Wave`.

## Working Rules

- Prioritize issues related to wallet connection, core product logic, and Soroban contract implementation.
- Avoid adding new functionality to legacy Cosmos/EVM paths unless the change is explicitly part of migration cleanup.
- Keep frontend wallet state, transaction orchestration, contract clients, and backend reads separated by clear interfaces.
- Prefer small, issue-scoped pull requests.

## Before Opening A Pull Request

1. Link the GitHub issue the work addresses.
2. Describe the technical approach and any migration tradeoffs.
3. List the validation steps you ran locally.
4. If the PR changes visible UI or user interaction behavior, include screenshots or a short demo video/GIF.

## UI Evidence Requirement

For changes that affect wallet connection UI, dashboard UI, transaction flow screens, user interaction flows, frontend components, or any other visible product behavior:

- Include before/after screenshots where applicable.
- Include a short demo video or GIF for interactive flows.

## Local Validation

Run the checks that apply to your change before opening a PR:

```sh
npm run lint
npm run build
```

If you introduce a Soroban workspace, also run the relevant Rust and contract checks for that workspace and include them in the PR description.

## Implementation Notes

- Keep naming aligned with `Drip Wave`, `Stellar`, and `Soroban`.
- Treat the current Solidity contract and EVM wallet code as legacy reference only.
- Document any new environment variables, contract IDs, or deployment steps in the same PR.
