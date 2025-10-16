#!/bin/bash

echo "🚀 Deploying Test Vault for Oracle Testing"
echo "==========================================="
echo ""

# Load from .env.deployment if it exists
if [ -f "$(dirname "$0")/.env.deployment" ]; then
    echo "🔐 Loading credentials from .env.deployment..."
    source "$(dirname "$0")/.env.deployment"
    PRIVATE_KEY=$DEPLOYER_PRIVATE_KEY
    echo "   ✅ Credentials loaded"
elif [ -f "$(dirname "$0")/.env" ]; then
    echo "🔐 Loading credentials from .env..."
    source "$(dirname "$0")/.env"
    if [ -n "$DEPLOYER_PRIVATE_KEY" ]; then
        PRIVATE_KEY=$DEPLOYER_PRIVATE_KEY
    fi
    echo "   ✅ Credentials loaded"
fi

# Check for private key
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: No private key found"
    echo ""
    echo "Please create .env.deployment with:"
    echo "  DEPLOYER_PRIVATE_KEY=0x..."
    echo ""
    echo "Or export it:"
    echo "  export PRIVATE_KEY=0x..."
    exit 1
fi

echo "✅ Private key found"
echo ""

# Get deployer address (without showing the key)
DEPLOYER=$(cast wallet address $PRIVATE_KEY)
echo "📍 Deployer: $DEPLOYER"
echo ""

# Check Base Sepolia ETH balance
echo "🔍 Checking Base Sepolia ETH balance..."
BALANCE=$(cast balance $DEPLOYER --rpc-url https://sepolia.base.org)
echo "   Balance: $BALANCE wei"

if [ "$BALANCE" = "0" ]; then
    echo ""
    echo "❌ No Base Sepolia ETH! Get some from:"
    echo "   https://www.alchemy.com/faucets/base-sepolia"
    exit 1
fi

BALANCE_ETH=$(echo "scale=6; $BALANCE / 1000000000000000000" | bc)
echo "   Balance: $BALANCE_ETH ETH"
echo "   ✅ Sufficient for deployment"
echo ""

# Deploy
echo "🔨 Deploying vault..."
echo ""

cd "$(dirname "$0")/../agent-contracts/contract-evm"

VERIFY_FLAG=""
if [ -n "$BASESCAN_API_KEY" ]; then
    VERIFY_FLAG="--verify --etherscan-api-key $BASESCAN_API_KEY"
    echo "✅ Will verify on Basescan"
fi

forge script script/999_deploy_test_vault.s.sol:DeployTestVault \
    --rpc-url https://sepolia.base.org \
    --broadcast \
    $VERIFY_FLAG \
    -vvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the deployed vault address from above"
echo "2. Verify AI_AGENT is correct (should be 0x3001bb...)"
echo "3. Update oracle config with new address"
echo "4. Test deposit flow!"
