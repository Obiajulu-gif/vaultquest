#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE"
  echo "Copy contracts/.env.example to contracts/.env and fill in values."
  exit 1
fi

set -o allexport
source "$ENV_FILE"
set +o allexport

if [[ -z "${DRIP_POOL_CONTRACT_ID-}" ]]; then
  echo "DRIP_POOL_CONTRACT_ID must be set in contracts/.env"
  exit 1
fi

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

mkdir -p "$ROOT_DIR/config"
cat > "$ROOT_DIR/config/contract-bindings.json" <<EOF
{
  "network": "$SOROBAN_ENV",
  "rpcUrl": "$RPC_URL",
  "networkPassphrase": "$NETWORK_PASSPHRASE",
  "contracts": {
    "dripPool": "$DRIP_POOL_CONTRACT_ID"
  },
  "admin": {
    "address": "$DRIP_POOL_ADMIN_ADDRESS"
  }
}
EOF

echo "Generated contract binding config at $ROOT_DIR/config/contract-bindings.json"
