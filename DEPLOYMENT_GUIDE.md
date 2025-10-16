# Phala Cloud Deployment Guide

Step-by-step guide to deploy NEAR MPC Oracle to Phala Cloud.

## Prerequisites

- Docker Desktop running
- Docker Hub account (or other registry)
- Phala Cloud account
- NEAR testnet account with funds

## Step 1: Prepare Environment Variables

Create a secure list of your environment variables. These will be set in Phala Cloud dashboard:

```bash
# Required Environment Variables for Phala
API_KEY=<generate-strong-random-key>
PORT=3001

NEAR_ACCOUNT_ID=gregx.testnet
NEAR_PRIVATE_KEY=<your-near-private-key>
NEAR_RPC_URL=https://rpc.testnet.near.org
MPC_CONTRACT_ID=v1.signer-prod.testnet
MPC_PATH=ethereum-1

ETHEREUM_SEPOLIA_RPC=https://ethereum-sepolia.publicnode.com
BASE_SEPOLIA_RPC=https://sepolia.base.org
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
OPTIMISM_SEPOLIA_RPC=https://sepolia.optimism.io

LOG_LEVEL=info
```

**Security Note**: Generate a strong API key:
```bash
# Generate random API key
openssl rand -hex 32
```

## Step 2: Build Docker Image

1. **Start Docker Desktop**

2. **Set your Docker registry** (use your Docker Hub username or other registry):
```bash
export DOCKER_REGISTRY=docker.io/yourusername
```

3. **Build and tag the image**:
```bash
cd near-mpc-oracle
docker build --platform linux/amd64 -t near-mpc-oracle:latest .
```

4. **Tag for registry**:
```bash
docker tag near-mpc-oracle:latest $DOCKER_REGISTRY/near-mpc-oracle:latest
```

5. **Test locally** (optional):
```bash
# Create .env file first with your variables
docker run -p 3001:3001 --env-file .env near-mpc-oracle:latest

# Test in another terminal:
curl http://localhost:3001/health
```

## Step 3: Push to Docker Registry

1. **Login to Docker Hub**:
```bash
docker login
# Enter your Docker Hub credentials
```

2. **Push image**:
```bash
docker push $DOCKER_REGISTRY/near-mpc-oracle:latest
```

3. **Verify push**:
```bash
echo "Image available at: $DOCKER_REGISTRY/near-mpc-oracle:latest"
```

## Step 4: Deploy to Phala Cloud

### Option A: Phala Cloud Dashboard (Recommended)

1. **Go to Phala Cloud**: https://cloud.phala.network

2. **Create New CVM**:
   - Click "Create New CVM" or "Deploy Container"
   - Select region (closest to your users)

3. **Configure Container**:
   - **Image**: `<your-registry>/near-mpc-oracle:latest`
   - **Port**: `3001`
   - **Health Check Path**: `/health`

4. **Set Environment Variables**:
   In the Phala dashboard, add each variable from Step 1:
   ```
   API_KEY = <your-generated-key>
   NEAR_ACCOUNT_ID = gregx.testnet
   NEAR_PRIVATE_KEY = <your-key>
   ... (add all variables)
   ```

5. **Configure Resources**:
   - CPU: 1.0 vCPU
   - Memory: 512 MB
   - Storage: 2 GB

6. **Enable TEE Attestation**:
   - Check "Enable TEE Attestation"
   - Enable "Auto-restart on failure"

7. **Deploy**:
   - Click "Deploy" or "Create CVM"
   - Wait for deployment (usually 2-5 minutes)

### Option B: Phala CLI (Advanced)

If you have Phala CLI installed:

```bash
# Login to Phala
phala login

# Deploy CVM
phala deploy \
  --image $DOCKER_REGISTRY/near-mpc-oracle:latest \
  --port 3001 \
  --env-file .env.phala \
  --cpu 1.0 \
  --memory 512M \
  --health-check /health
```

## Step 5: Verify Deployment

1. **Get CVM URL** from Phala dashboard (something like `https://your-cvm-id.phala.cloud`)

2. **Test health endpoint**:
```bash
curl https://your-cvm-id.phala.cloud/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "near-mpc-oracle",
  "timestamp": "2025-10-16T..."
}
```

3. **Test agent address** (requires API key):
```bash
curl https://your-cvm-id.phala.cloud/api/oracle/agent-address \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected response:
```json
{
  "agentAddress": "0x3001bb6aa8beed7db35a05c171dbac32341cdd1a"
}
```

4. **Test pool value**:
```bash
curl https://your-cvm-id.phala.cloud/api/oracle/pool-value \
  -H "Authorization: Bearer YOUR_API_KEY"
```

5. **Test signature generation**:
```bash
curl -X POST https://your-cvm-id.phala.cloud/api/oracle/balance-snapshot \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assets": "1000000",
    "receiver": "0x3001bb6aa8beed7db35a05c171dbac32341cdd1a",
    "vaultChainId": 84532
  }'
```

## Step 6: Configure Backend & Frontend

### Backend Configuration

Update `aaveDapp/aave-rebalancer-backend/.env`:
```bash
ORACLE_URL=https://your-cvm-id.phala.cloud
ORACLE_API_KEY=<your-generated-api-key>
```

### Frontend Configuration

Update `aaveDapp/aave/.env.local`:
```bash
NEXT_PUBLIC_ORACLE_URL=https://your-cvm-id.phala.cloud
NEXT_PUBLIC_ORACLE_API_KEY=<your-generated-api-key>
```

**Important**: The same API key works for both backend and frontend since frontend calls oracle directly for deposit signatures.

## Step 7: Test End-to-End

### Test Backend Integration

```bash
cd aaveDapp/aave-rebalancer-backend
npm run dev

# In another terminal, trigger performance calculation
curl http://localhost:4000/api/test-performance
```

Check logs for:
```
Using real-time pool value from oracle: $XXX
```

### Test Frontend Integration

```bash
cd aaveDapp/aave
npm run dev

# Open http://localhost:3000
# Connect wallet
# Try a deposit - you should see:
# "Getting cross-chain signature..." message
```

## Monitoring & Maintenance

### View Logs

In Phala Cloud dashboard:
- Go to your CVM
- Click "Logs" tab
- Monitor for errors

### Check TEE Attestation

```bash
curl https://your-cvm-id.phala.cloud/api/attestation
```

### Update Deployment

To update with new code:

1. Build new image:
```bash
docker build --platform linux/amd64 -t near-mpc-oracle:v1.1 .
docker tag near-mpc-oracle:v1.1 $DOCKER_REGISTRY/near-mpc-oracle:v1.1
docker push $DOCKER_REGISTRY/near-mpc-oracle:v1.1
```

2. Update CVM in Phala dashboard:
   - Update image tag to `:v1.1`
   - Click "Redeploy"

### Rotate API Key

To rotate API key securely:

1. Generate new key: `openssl rand -hex 32`
2. Update in Phala dashboard environment variables
3. Restart CVM
4. Update backend and frontend `.env` files
5. Redeploy backend/frontend

## Troubleshooting

### Issue: "Cannot connect to oracle"

**Check**:
- CVM is running in Phala dashboard
- URL is correct
- API key is set correctly

### Issue: "Invalid API key"

**Check**:
- API_KEY environment variable is set in Phala
- Authorization header format: `Bearer <key>`
- No extra spaces in API key

### Issue: "NEAR transaction failed"

**Check**:
- NEAR account has sufficient balance
- NEAR_PRIVATE_KEY is correct format (starts with `ed25519:`)
- NEAR_RPC_URL is accessible from Phala

### Issue: "Signature verification failed"

**Check**:
- Vault contract's `AI_AGENT` matches oracle agent address (`0x3001bb6aa8beed7db35a05c171dbac32341cdd1a`)
- Using correct vault chain ID in request

### Issue: High latency

**Possible causes**:
- RPC endpoints are slow (use premium RPCs like Alchemy)
- NEAR MPC signing is slow (normal, 5-10 seconds)
- CVM is in wrong region

**Solutions**:
- Use faster RPC providers
- Cache balance queries (short 30-60s cache)
- Deploy CVM closer to users

## Cost Estimation

Phala Cloud costs (approximate):
- CVM instance: $10-30/month
- Network egress: $0.01/GB
- Storage: $0.10/GB/month

Total estimated: **$15-35/month** for production oracle

## Security Best Practices

1. **Never commit** `.env` files to git
2. **Rotate API keys** every 90 days
3. **Monitor access logs** in Phala dashboard
4. **Use separate keys** for dev/staging/production
5. **Enable TEE attestation** for production
6. **Set resource limits** to prevent abuse
7. **Use HTTPS only** for all requests

## Support

- Phala Cloud Docs: https://docs.phala.network
- Phala Discord: https://discord.gg/phala-network
- Oracle Issues: [Your GitHub repo]/issues

## Next Steps

After successful deployment:

1. [ ] Update README.md with production oracle URL
2. [ ] Share oracle URL and API key with team (securely)
3. [ ] Set up monitoring alerts
4. [ ] Test all integration points
5. [ ] Document for coworkers
6. [ ] Set up backup/failover (optional)

---

**Deployment Status**: Ready for production
**Last Updated**: 2025-10-16

