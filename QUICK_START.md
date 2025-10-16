# Quick Start - Phala Deployment

The fastest path to get your oracle running on Phala Cloud.

## 1. Generate API Key (30 seconds)

```bash
openssl rand -hex 32
```

Save this key - you'll need it everywhere.

## 2. Build & Push (5-10 minutes)

```bash
# Start Docker Desktop first!

# Set your registry
export DOCKER_REGISTRY=docker.io/yourusername

# Build and push
cd near-mpc-oracle
./build-and-push.sh
```

## 3. Deploy to Phala (5 minutes)

1. Go to https://cloud.phala.network
2. Click "Create New CVM"
3. Set image: `docker.io/yourusername/near-mpc-oracle:latest`
4. Set port: `3001`
5. Add environment variables:
   ```
   API_KEY=<your-generated-key>
   NEAR_ACCOUNT_ID=gregx.testnet
   NEAR_PRIVATE_KEY=<your-key>
   NEAR_RPC_URL=https://rpc.testnet.near.org
   MPC_CONTRACT_ID=v1.signer-prod.testnet
   MPC_PATH=ethereum-1
   ETHEREUM_SEPOLIA_RPC=https://ethereum-sepolia.publicnode.com
   BASE_SEPOLIA_RPC=https://sepolia.base.org
   ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
   OPTIMISM_SEPOLIA_RPC=https://sepolia.optimism.io
   LOG_LEVEL=info
   ```
6. Click "Deploy"

## 4. Test (2 minutes)

```bash
# Health check
curl https://your-cvm-id.phala.cloud/health

# Test with API key
curl https://your-cvm-id.phala.cloud/api/oracle/agent-address \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 5. Configure Apps (2 minutes)

### Backend
Add to `aave-rebalancer-backend/.env`:
```
ORACLE_URL=https://your-cvm-id.phala.cloud
ORACLE_API_KEY=<your-api-key>
```

### Frontend
Add to `aave/.env.local`:
```
NEXT_PUBLIC_ORACLE_URL=https://your-cvm-id.phala.cloud
NEXT_PUBLIC_ORACLE_API_KEY=<your-api-key>
```

## Done! 🎉

Your oracle is now running in a secure TEE on Phala Cloud.

See `DEPLOYMENT_GUIDE.md` for detailed instructions.
See `DEPLOYMENT_CHECKLIST.md` to track progress.

