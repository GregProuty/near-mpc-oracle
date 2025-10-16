# Deployment Checklist

Use this checklist to track your Phala deployment progress.

## Pre-Deployment

- [ ] Docker Desktop installed and running
- [ ] Docker Hub account created
- [ ] Phala Cloud account created
- [ ] NEAR account funded (gregx.testnet)
- [ ] Generated strong API key (see below)

### Generate API Key

Run this command to generate a secure API key:
```bash
openssl rand -hex 32
```

Save this key securely - you'll need it for:
- Phala environment variables
- Backend configuration  
- Frontend configuration

---

## Build & Push Image

- [ ] Start Docker Desktop
- [ ] Set Docker registry:
  ```bash
  export DOCKER_REGISTRY=docker.io/yourusername
  ```
- [ ] Run build script:
  ```bash
  cd near-mpc-oracle
  ./build-and-push.sh
  ```
- [ ] Verify image pushed to registry
- [ ] Copy image URL (e.g., `docker.io/yourusername/near-mpc-oracle:latest`)

---

## Phala Cloud Deployment

- [ ] Login to https://cloud.phala.network
- [ ] Click "Create New CVM" or "Deploy Container"
- [ ] Configure container:
  - Image: `<your-registry>/near-mpc-oracle:latest`
  - Port: `3001`
  - Health check: `/health`
- [ ] Set environment variables in Phala dashboard:
  - [ ] `API_KEY` (your generated key)
  - [ ] `PORT=3001`
  - [ ] `NEAR_ACCOUNT_ID=gregx.testnet`
  - [ ] `NEAR_PRIVATE_KEY=<your-key>`
  - [ ] `NEAR_RPC_URL=https://rpc.testnet.near.org`
  - [ ] `MPC_CONTRACT_ID=v1.signer-prod.testnet`
  - [ ] `MPC_PATH=ethereum-1`
  - [ ] `ETHEREUM_SEPOLIA_RPC=https://ethereum-sepolia.publicnode.com`
  - [ ] `BASE_SEPOLIA_RPC=https://sepolia.base.org`
  - [ ] `ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc`
  - [ ] `OPTIMISM_SEPOLIA_RPC=https://sepolia.optimism.io`
  - [ ] `LOG_LEVEL=info`
- [ ] Configure resources:
  - CPU: 1.0 vCPU
  - Memory: 512 MB
  - Storage: 2 GB
- [ ] Enable TEE Attestation
- [ ] Enable Auto-restart on failure
- [ ] Click "Deploy"
- [ ] Wait for deployment (2-5 minutes)
- [ ] Copy CVM URL (e.g., `https://your-cvm-id.phala.cloud`)

---

## Verification

Test each endpoint to confirm deployment:

- [ ] Health check:
  ```bash
  curl https://your-cvm-id.phala.cloud/health
  ```
  Expected: `{"status":"ok",...}`

- [ ] Agent address:
  ```bash
  curl https://your-cvm-id.phala.cloud/api/oracle/agent-address \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```
  Expected: `{"agentAddress":"0x3001bb6aa8beed7db35a05c171dbac32341cdd1a"}`

- [ ] Pool value:
  ```bash
  curl https://your-cvm-id.phala.cloud/api/oracle/pool-value \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```
  Expected: `{"totalATokens":"...","totalPoolValue":"...",...}`

- [ ] Balance snapshot:
  ```bash
  curl -X POST https://your-cvm-id.phala.cloud/api/oracle/balance-snapshot \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"assets":"1000000","receiver":"0x3001bb6aa8beed7db35a05c171dbac32341cdd1a","vaultChainId":84532}'
  ```
  Expected: `{"balance":"...","signature":"0x...","agentAddress":"0x3001bb..."}`

---

## Backend Integration

- [ ] Update `aaveDapp/aave-rebalancer-backend/.env`:
  ```bash
  ORACLE_URL=https://your-cvm-id.phala.cloud
  ORACLE_API_KEY=<your-api-key>
  ```
- [ ] Restart backend server
- [ ] Trigger performance calculation manually
- [ ] Check logs for: "Using real-time pool value from oracle: $XXX"
- [ ] Verify no errors in logs

---

## Frontend Integration

- [ ] Update `aaveDapp/aave/.env.local`:
  ```bash
  NEXT_PUBLIC_ORACLE_URL=https://your-cvm-id.phala.cloud
  NEXT_PUBLIC_ORACLE_API_KEY=<your-api-key>
  ```
- [ ] Restart frontend dev server
- [ ] Open frontend in browser
- [ ] Connect wallet
- [ ] Initiate test deposit
- [ ] Verify message: "Getting cross-chain signature..."
- [ ] Verify deposit transaction succeeds
- [ ] Check vault balance increased

---

## Documentation & Sharing

- [ ] Save CVM URL in secure location
- [ ] Save API key in password manager
- [ ] Update team documentation with oracle URL
- [ ] Share deployment info with coworkers (securely)
- [ ] Document any custom configuration
- [ ] Set up monitoring alerts (optional)

---

## Post-Deployment

- [ ] Monitor Phala dashboard for errors
- [ ] Check CVM logs regularly for first few days
- [ ] Verify TEE attestation is valid
- [ ] Set calendar reminder to rotate API key (90 days)
- [ ] Create backup plan (optional)

---

## Troubleshooting

If you encounter issues, see DEPLOYMENT_GUIDE.md Troubleshooting section.

Common issues:
- Docker not running → Start Docker Desktop
- Image push fails → Run `docker login` first
- CVM fails to start → Check environment variables
- Oracle returns 401 → Verify API key is correct
- Signature fails → Check vault AI_AGENT address matches

---

**Deployment Date**: _____________
**CVM URL**: _____________
**API Key Location**: _____________
**Docker Image**: _____________

---

**Status**: Ready for deployment ✓

