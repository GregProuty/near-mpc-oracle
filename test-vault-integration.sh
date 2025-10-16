#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./test-vault-integration.sh <VAULT_ADDRESS>"
    echo "Example: ./test-vault-integration.sh 0x123..."
    exit 1
fi

VAULT=$1
echo "🧪 Testing Oracle Integration with Vault: $VAULT"
echo "================================================"
echo ""

# Check AI_AGENT
echo "1️⃣  Verifying AI_AGENT..."
AI_AGENT=$(cast call $VAULT "AI_AGENT()(address)" --rpc-url https://sepolia.base.org)
echo "   AI_AGENT: $AI_AGENT"

# Case-insensitive comparison
AI_AGENT_LOWER=$(echo "$AI_AGENT" | tr '[:upper:]' '[:lower:]')
EXPECTED_LOWER=$(echo "0x3001bb6aa8beed7db35a05c171dbac32341cdd1a" | tr '[:upper:]' '[:lower:]')

if [ "$AI_AGENT_LOWER" = "$EXPECTED_LOWER" ]; then
    echo "   ✅ Correct!"
else
    echo "   ❌ WRONG! Expected: 0x3001bb6aa8beed7db35a05c171dbac32341cdd1a"
    echo "   Got (lowercase): $AI_AGENT_LOWER"
    exit 1
fi
echo ""

# Get oracle agent address
echo "2️⃣  Checking Oracle..."
ORACLE_AGENT=$(curl -s http://localhost:3001/api/oracle/agent-address | jq -r '.agentAddress')
echo "   Oracle Agent: $ORACLE_AGENT"

# Case-insensitive comparison
ORACLE_AGENT_LOWER=$(echo "$ORACLE_AGENT" | tr '[:upper:]' '[:lower:]')

if [ "$ORACLE_AGENT_LOWER" = "$AI_AGENT_LOWER" ]; then
    echo "   ✅ Match!"
else
    echo "   ❌ Mismatch!"
    echo "   Vault AI_AGENT:  $AI_AGENT_LOWER"
    echo "   Oracle Agent:    $ORACLE_AGENT_LOWER"
    exit 1
fi
echo ""

# Get a test signature
echo "3️⃣  Getting test signature from oracle..."
TEST_RECEIVER="0x742d35cc6634c0532925a3b844bc9e7595f0beb0"
SNAPSHOT=$(curl -s -X POST http://localhost:3001/api/oracle/balance-snapshot \
    -H "Content-Type: application/json" \
    -d "{\"receiver\":\"$TEST_RECEIVER\",\"assets\":\"1000000\",\"vaultChainId\":84532}")

echo "$SNAPSHOT" | jq
echo ""

SIGNATURE=$(echo "$SNAPSHOT" | jq -r '.signature')
echo "   Signature: ${SIGNATURE:0:20}..."
echo ""

# Verify signature offline
echo "4️⃣  Verifying signature offline..."
echo "$SNAPSHOT" > /tmp/test-vault-snapshot.json
cd /Users/grey/Documents/rebalancy/near-mpc-oracle
cp /tmp/test-vault-snapshot.json /tmp/snapshot.json
node verify-signature.js

echo ""
echo "✅ All checks passed!"
echo ""
echo "🎯 Next: Test actual deposit"
echo "   1. Get Base Sepolia USDC from faucet"
echo "   2. Approve vault to spend USDC"
echo "   3. Call vault.deposit()"
echo ""
