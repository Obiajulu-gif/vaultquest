#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE"
  echo "Copy contracts/.env.example to contracts/.env and fill in values."
  exit 1
fi

# Load environment variables.
set -o allexport
source "$ENV_FILE"
set +o allexport

# Resolve env-specific values.
if [[ "$SOROBAN_ENV" == "local" ]]; then
  RPC_URL="$SOROBAN_RPC_URL_LOCAL"
  NETWORK_PASSPHRASE="$SOROBAN_NETWORK_PASSPHRASE_LOCAL"
elif [[ "$SOROBAN_ENV" == "testnet" ]]; then
  RPC_URL="$SOROBAN_RPC_URL_TESTNET"
  NETWORK_PASSPHRASE="$SOROBAN_NETWORK_PASSPHRASE_TESTNET"
else
  echo "Unsupported SOROBAN_ENV='$SOROBAN_ENV'. Use local or testnet."
  exit 1
fi

WASM_PATH="$ROOT_DIR/$DRIP_POOL_WASM_PATH"
if [[ ! -f "$WASM_PATH" ]]; then
  echo "Contract WASM not found at $WASM_PATH"
  echo "Build the contract first with: cargo build --release --manifest-path $ROOT_DIR/Cargo.toml"
  exit 1
fi

if [[ -z "${DRIP_POOL_ADMIN_ADDRESS-}" || -z "${DRIP_POOL_ADMIN_SECRET-}" ]]; then
  echo "DRIP_POOL_ADMIN_ADDRESS and DRIP_POOL_ADMIN_SECRET must be set in contracts/.env"
  exit 1
fi

if ! command -v soroban >/dev/null 2>&1; then
  echo "soroban CLI not found. Install it first: https://soroban.stellar.org/docs/learn/getting-started"
  exit 1
fi

echo "Deploying Drip Pool contract to $SOROBAN_ENV ($RPC_URL)"

# Deploy contract and capture output. Adjust CLI flags if your soroban version differs.
DEPLOY_OUTPUT=$(soroban contract deploy \
  --wasm "$WASM_PATH" \
  --source "$DRIP_POOL_ADMIN_ADDRESS" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  --rpc-url "$RPC_URL" \
  --output json)

CONTRACT_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE '"contract_id"\s*:\s*"[A-Z0-9]+"' | cut -d '"' -f 4 || true)

if [[ -z "$CONTRACT_ID" ]]; then
  echo "Deployment succeeded but contract ID could not be parsed from CLI output." >&2
  echo "Raw output:"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo "Contract deployed: $CONTRACT_ID"

echo "Writing contract binding config to $ROOT_DIR/config/contract-bindings.json"
mkdir -p "$ROOT_DIR/config"
cat > "$ROOT_DIR/config/contract-bindings.json" <<EOF
{
  "network": "$SOROBAN_ENV",
  "rpcUrl": "$RPC_URL",
  "networkPassphrase": "$NETWORK_PASSPHRASE",
  "contracts": {
    "dripPool": "$CONTRACT_ID"
  },
  "admin": {
    "address": "$DRIP_POOL_ADMIN_ADDRESS"
  }
}
EOF

echo "Deployment config written. Update your frontend/backend consumers to read contracts/config/contract-bindings.json or set matching environment variables."
