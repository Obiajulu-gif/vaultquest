#!/bin/bash
set -e 

NETWORK=${1:-testnet}
echo "Starting deployment to $NETWORK..."

# 1. Validate environment
if [ -z "$SOROBAN_ACCOUNT_SECRET" ]; then
  echo "Error: SOROBAN_ACCOUNT_SECRET is not set"
  exit 1
fi

# 2. Set RPC and Passphrase
if [ "$NETWORK" = "public" ]; then
    RPC_URL="https://soroban-mainnet.stellar.org"
    PASS="Public Global Stellar Network ; September 2015"
else
    RPC_URL="https://soroban-testnet.stellar.org"
    PASS="Test SDF Network ; September 2015"
fi

# 3. Build step (Required for CI/CD)
echo "Building contracts for wasm32..."
cargo build --release --target wasm32-unknown-unknown

# 4. Deploy logic
CONTRACTS=("drip_pool")
mkdir -p contracts/ids
JSON_FILE="contracts/ids/${NETWORK}.json"
echo "{" > "$JSON_FILE"

TOTAL=${#CONTRACTS[@]}
CURRENT=0

for CONTRACT in "${CONTRACTS[@]}"; do
    echo "Deploying $CONTRACT..."
    WASM="target/wasm32-unknown-unknown/release/${CONTRACT}.wasm"
    
    ID=$(soroban contract deploy \
        --wasm "$WASM" \
        --source "$SOROBAN_ACCOUNT_SECRET" \
        --rpc-url "$RPC_URL" \
        --network-passphrase "$PASS")
        
    CURRENT=$((CURRENT + 1))
    COMMA=$([ "$CURRENT" -eq "$TOTAL" ] && echo "" || echo ",")
    echo "  \"$CONTRACT\": \"$ID\"$COMMA" >> "$JSON_FILE"
    echo "Deployed $CONTRACT: $ID"
done

echo "}" >> "$JSON_FILE"