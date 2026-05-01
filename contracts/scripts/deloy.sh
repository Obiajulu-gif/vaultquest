#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e 

# Default to testnet if no network is provided
NETWORK=${1:-testnet}
echo "Starting deployment to $NETWORK..."

# 1. Set correct Soroban RPC endpoints based on network (Fixes CodeRabbit Error)
if [ "$NETWORK" = "public" ]; then
    RPC_URL="https://soroban-mainnet.stellar.org"
    NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
else
    RPC_URL="https://soroban-testnet.stellar.org"
    NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
fi

# 2. LIST YOUR CONTRACTS HERE
# If you have more than one, space them out like: ("drip_pool" "rewards_pool" "vault")
# Using the underscore version because that's how the .wasm file will be named
CONTRACTS=("drip_pool")

# 3. Prepare the JSON file directory
mkdir -p contracts/ids
JSON_FILE="contracts/ids/$NETWORK.json"
echo "{" > "$JSON_FILE"

TOTAL=${#CONTRACTS[@]}
CURRENT=0

# 4. Loop through and deploy each contract
for CONTRACT in "${CONTRACTS[@]}"; do
    echo "Deploying $CONTRACT..."
    
    WASM_PATH="target/wasm32-unknown-unknown/release/${CONTRACT}.wasm"
    
    # Deploy using the secret from GitHub Actions
    CONTRACT_ID=$(soroban contract deploy \
        --wasm "$WASM_PATH" \
        --source "$SOROBAN_ACCOUNT_SECRET" \
        --rpc-url "$RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE")
        
    echo "Successfully deployed $CONTRACT! ID: $CONTRACT_ID"
    
    # Format JSON output properly
    CURRENT=$((CURRENT + 1))
    if [ "$CURRENT" -eq "$TOTAL" ]; then
        echo "  \"$CONTRACT\": \"$CONTRACT_ID\"" >> "$JSON_FILE"
    else
        echo "  \"$CONTRACT\": \"$CONTRACT_ID\"," >> "$JSON_FILE"
    fi
done

echo "}" >> "$JSON_FILE"

echo "Deployment complete! Contract IDs saved successfully:"
cat "$JSON_FILE"