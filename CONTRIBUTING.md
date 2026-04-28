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

### Frontend Checks

```sh
# Install dependencies
npm install

# Run linter
npm run lint

# Run type check (if TypeScript is used)
npx tsc --noEmit

# Build the application
npm run build

# Start development server
npm run dev
```

### Soroban Contract Checks (if applicable)

If you introduce or modify a Soroban workspace, also run these checks:

```sh
# Check formatting
cargo fmt --all -- --check

# Run clippy linter
cargo clippy --workspace --all-targets --all-features -- -D warnings

# Run tests
cargo test --workspace --all-targets --all-features

# Build release Wasm artifacts
cargo build --workspace --target wasm32v1-none --release
```

### CI/CD Pipeline

The repository uses GitHub Actions for automated quality checks:

- **Frontend CI**: Runs on every push to `main`/`develop` and on PRs affecting frontend files. It performs linting, type checking, testing, and building.
- **Smart Contract CI**: Runs on every push to `main`/`develop` and on PRs affecting contract files. It includes conditional Soroban contract checks that only run when a Rust workspace is detected.

These workflows provide clear failure output to help diagnose broken PRs quickly.

## Implementation Notes

- Keep naming aligned with `Drip Wave`, `Stellar`, and `Soroban`.
- Treat the current Solidity contract and EVM wallet code as legacy reference only.
- Document any new environment variables, contract IDs, or deployment steps in the same PR.
