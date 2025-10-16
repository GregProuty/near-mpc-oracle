# Deploy to Phala Cloud - Web Dashboard

The CLI is having API compatibility issues. Use the web dashboard instead - it's more reliable.

## Step 1: Go to Phala Cloud

Visit: **https://cloud.phala.network**

## Step 2: Create New CVM

Look for button: **"Deploy"** or **"New Instance"** or **"Create CVM"**

## Step 3: Fill in the Form

### Basic Settings
- **Name**: `near-mpc-oracle`
- **Docker Image**: `docker.io/gregdev0x/near-mpc-oracle:latest`
- **Port**: `3001`

### Resources
- **vCPU**: `1`
- **Memory**: `1024 MB` (or 512 MB if available)
- **Storage**: `10 GB`

### Environment Variables

Click "Add Environment Variable" and add each of these:

```
API_KEY = phak__Gf8RSmDH8EeIkSJoCHRhE-VW4w1zotHytMp5CKAAPQ
```

```
PORT = 3001
```

```
NEAR_ACCOUNT_ID = gregx.testnet
```

```
NEAR_PRIVATE_KEY = ed25519:42iep6DPoQPngd4rcu6LBqGR6Y3j6uKjtqKcqMKrzvTTJrKx6Ydn8nz7GoevZ2jr3UCfo9bK4LPo8z16xVh3CDnD
```

```
NEAR_RPC_URL = https://rpc.testnet.near.org
```

```
MPC_CONTRACT_ID = v1.signer-prod.testnet
```

```
MPC_PATH = ethereum-1
```

```
ETHEREUM_SEPOLIA_RPC = https://ethereum-sepolia.publicnode.com
```

```
BASE_SEPOLIA_RPC = https://sepolia.base.org
```

```
ARBITRUM_SEPOLIA_RPC = https://sepolia-rollup.arbitrum.io/rpc
```

```
OPTIMISM_SEPOLIA_RPC = https://sepolia.optimism.io
```

```
LOG_LEVEL = info
```

### Advanced Settings (Optional)
- ✅ Enable **TEE Attestation**
- ✅ Enable **Auto-restart**
- **Health Check Path**: `/health`

## Step 4: Deploy

Click **"Deploy"** or **"Create"** button

Wait 2-5 minutes for deployment.

## Step 5: Get Your URL

Once deployed, Phala will show your CVM URL like:
```
https://your-cvm-id.phala.cloud
```

**Copy this URL** - you'll need it for testing and configuration.

## Step 6: Test Your Deployment

Replace `YOUR_CVM_URL` with your actual URL:

```bash
# Health check (no auth)
curl https://YOUR_CVM_URL/health

# Agent address (with auth)
curl https://YOUR_CVM_URL/api/oracle/agent-address \
  -H "Authorization: Bearer phak__Gf8RSmDH8EeIkSJoCHRhE-VW4w1zotHytMp5CKAAPQ"
```

Expected response:
```json
{"agentAddress":"0x3001bb6aa8beed7db35a05c171dbac32341cdd1a"}
```

## Step 7: Update Your Apps

### Backend
Edit `aave-rebalancer-backend/.env`:
```bash
ORACLE_URL=https://YOUR_CVM_URL
ORACLE_API_KEY=phak__Gf8RSmDH8EeIkSJoCHRhE-VW4w1zotHytMp5CKAAPQ
```

### Frontend
Edit `aave/.env.local`:
```bash
NEXT_PUBLIC_ORACLE_URL=https://YOUR_CVM_URL
NEXT_PUBLIC_ORACLE_API_KEY=phak__Gf8RSmDH8EeIkSJoCHRhE-VW4w1zotHytMp5CKAAPQ
```

---

**Status**: Ready to deploy via web dashboard ✓

All credentials are configured in phala.env and ready to copy-paste.

