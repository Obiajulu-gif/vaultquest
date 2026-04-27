# Soroban Deployment and Contract Binding Configuration

This document describes the deployment tooling, environment handling, and contract-binding configuration for Drip Wave Soroban contracts.

## Goals

- Provide repeatable local and testnet deployment scripts.
- Keep environment-specific secrets out of source control.
- Emit a frontend/backend-consumable binding file after deployment.
- Document the refresh path when contract interfaces or IDs change.

## Supported Environments

- `local` — local Soroban network running on `localhost`
- `testnet` — shared Soroban testnet
- `production` — reserved for future production-like deployments

## Setup

1. Copy `contracts/.env.example` to `contracts/.env`.
2. Fill in your deployer/admin address, secret, and target environment values.
3. Ensure `contracts/.env` is not committed (the repo ignores `.env*`).

## Deployment Scripts

### `contracts/scripts/deploy_soroban.sh`

Deploys the compiled contract to the selected network and writes a generated contract-binding file to `contracts/config/contract-bindings.json`.

Usage:

```bash
cd contracts
bash scripts/deploy_soroban.sh
```

### `contracts/scripts/generate_contract_bindings.sh`

Generates binding configuration from an existing contract ID in `contracts/.env`.

Usage:

```bash
cd contracts
bash scripts/generate_contract_bindings.sh
```

## Build + Deploy Flow

1. Build the Soroban contract:
   ```bash
   cd contracts
   cargo build --release --manifest-path Cargo.toml
   ```
2. Ensure `contracts/.env` exists and points to the correct environment.
3. Deploy the contract:
   ```bash
   bash scripts/deploy_soroban.sh
   ```
4. After deployment, `contracts/config/contract-bindings.json` is generated.

## Frontend / Backend Consumption

Consumers should read the generated config file or mirror its values in their environment management.

Example frontend consumer keys:

- `network`
- `rpcUrl`
- `networkPassphrase`
- `contracts.dripPool`
- `admin.address`

## Contract Bindings Refresh Path

1. Update the contract code and rebuild the WASM.
2. Re-run `bash scripts/deploy_soroban.sh` for the target environment.
3. Confirm the new `contracts/config/contract-bindings.json` contains the new contract ID.
4. Update downstream services if the contract interface or ID changes.

## Notes

- The contract binding config file is environment-specific and should be generated after each deployment.
- Use `.env` for secrets and `contracts/config/contract-bindings.template.json` for checked-in example bindings.
- If you need to support a new environment, add the RPC URL and passphrase to `contracts/.env.example` and `contracts/.env`.
