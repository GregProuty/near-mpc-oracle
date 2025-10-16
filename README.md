# NEAR MPC Oracle

Multichain aToken balance aggregation oracle with NEAR MPC cryptographic signing for Aave vault operations.

## Overview

This oracle aggregates USDC and aToken balances across multiple EVM chains and provides cryptographically signed attestations using NEAR's Multi-Party Computation (MPC) protocol. It serves two primary functions:

1. **Deposit Signatures**: Provides EIP-712 signed balance snapshots for `depositWithExtraInfoViaSignature` on Aave vaults
2. **Pool Performance**: Aggregates total pool value (aTokens + USDC) across all chains for accurate performance calculations

## Architecture

```
┌──────────┐      ┌─────────────┐      ┌──────────────────┐      ┌─────────┐
│ Frontend │─────>│   Oracle    │─────>│ NEAR MPC Signer  │─────>│ Vaults  │
│          │<─────│   Server    │<─────│ v1.signer-prod   │<─────│ (EVM)   │
└──────────┘      └─────────────┘      └──────────────────┘      └─────────┘
    ^                    │                                             │
    │                    └─────────────────────────────────────────────┘
    │                          Query balances from:
    │                       - Base Sepolia
    │                       - Arbitrum Sepolia  
    │                       - Ethereum Sepolia
    │                       - Optimism Sepolia
    └────────────────────────────────────────────────────────────────────────
                     Signature verified by vault smart contract
```

## Key Features

- Real-time balance aggregation across multiple EVM chains
- NEAR MPC signatures via `v1.signer-prod.testnet`
- EIP-712 typed data hashing for vault contract verification
- API key authentication for secure access
- Supports both testnet and mainnet deployments
- Production-ready code with real on-chain data

## Agent Address

The oracle's EVM address (derived from NEAR MPC):

```
0x3001bb6aa8beed7db35a05c171dbac32341cdd1a
```

Derivation:
- NEAR Account: `gregx.testnet`
- MPC Contract: `v1.signer-prod.testnet`
- Path: `ethereum-1`
- Method: KDF with SHA3-256 and secp256k1

## API Endpoints

All endpoints except `/health` require authentication.

### Authentication

Include API key in request header:
```
Authorization: Bearer YOUR_API_KEY
```

### GET /health

Health check endpoint (no auth required).

**Response**:
```json
{
  "status": "ok",
  "service": "near-mpc-oracle",
  "timestamp": "2025-10-16T12:00:00.000Z"
}
```

### GET /api/oracle/agent-address

Returns the MPC-derived agent address.

**Response**:
```json
{
  "agentAddress": "0x3001bb6aa8beed7db35a05c171dbac32341cdd1a"
}
```

### GET /api/oracle/pool-value

Returns aggregated balances across all chains for performance tracking.

**Query Parameters**:
- `vaultChainId` (optional): Filter by specific chain

**Response**:
```json
{
  "totalATokens": "1234567890",
  "totalUSDC": "500000000", 
  "totalPoolValue": "1734567890",
  "breakdown": [
    {
      "chainId": 84532,
      "chainName": "baseSepolia",
      "aTokens": "1000000000",
      "usdc": "250000000"
    }
  ],
  "timestamp": 1760561159
}
```

### POST /api/oracle/balance-snapshot

Generates a signed balance snapshot for `depositWithExtraInfoViaSignature`.

**Request**:
```json
{
  "assets": "1000000",
  "receiver": "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
  "vaultChainId": 84532
}
```

**Response**:
```json
{
  "balance": "1234567890",
  "nonce": "5",
  "deadline": "1760561459",
  "assets": "1000000",
  "receiver": "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
  "signature": "0x5cf4f3a9bb03ac4672c9686b60e52d158105b99faaec32bf754c26b1b215f45217f064aed00e82e107a99dad0da625bd6a19d96c62210ba2a3a6853ea7bb205200",
  "agentAddress": "0x3001bb6aa8beed7db35a05c171dbac32341cdd1a"
}
```

## Setup

### Prerequisites

- Node.js 18+
- NEAR testnet account with funding
- EVM RPC endpoints (Alchemy, Infura, or public)
- Deployed Aave vault contracts

### Installation

```bash
# Clone repository
git clone <repository-url>
cd near-mpc-oracle

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your configuration
```

### Environment Variables

Required variables (see `env.example` for full template):

```bash
# API Configuration
API_KEY=your-secret-api-key-here
PORT=3001

# NEAR MPC Configuration
NEAR_ACCOUNT_ID=your-account.testnet
NEAR_PRIVATE_KEY=ed25519:your-private-key-here
NEAR_RPC_URL=https://rpc.testnet.near.org
MPC_CONTRACT_ID=v1.signer-prod.testnet
MPC_PATH=ethereum-1

# EVM RPC Endpoints (Testnet)
ETHEREUM_SEPOLIA_RPC=https://ethereum-sepolia.publicnode.com
BASE_SEPOLIA_RPC=https://sepolia.base.org
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
OPTIMISM_SEPOLIA_RPC=https://sepolia.optimism.io
```

For production, use mainnet RPC URLs and update chain configurations in `src/config/chains.ts`.

### Running Locally

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

Server will start on `http://localhost:3001` (or configured PORT).

## Deployment

### Docker

```bash
# Build image
docker build -t near-mpc-oracle .

# Run container
docker run -p 3001:3001 --env-file .env near-mpc-oracle
```

### Phala Cloud TEE

1. **Build Docker image**:
   ```bash
   docker build -t near-mpc-oracle:latest .
   ```

2. **Push to registry** (Docker Hub, GitHub Container Registry, etc.)

3. **Deploy to Phala Cloud**:
   - Log in to Phala Cloud dashboard
   - Create new CVM instance
   - Provide Docker image URL
   - Set environment variables in dashboard
   - Start CVM

4. **Configure environment in Phala**:
   - Set all required environment variables from `env.example`
   - Include `API_KEY`, `NEAR_PRIVATE_KEY`, and RPC endpoints
   - Enable TEE attestation

5. **Verify deployment**:
   ```bash
   curl https://your-cvm-url/health
   curl https://your-cvm-url/api/oracle/agent-address \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## Integration

### Frontend (Deposit Flow)

```typescript
import { getDepositSignature } from '@/utils/oracleClient';

// Get signature from oracle
const snapshot = await getDepositSignature(
  assets.toString(),
  userAddress,
  chainId
);

// Call vault contract
await contract.depositWithExtraInfoViaSignature(
  assets,
  userAddress,
  snapshot,
  snapshot.signature
);
```

### Backend (Performance Tracking)

```typescript
import { oracleClient } from './services/oracleClient';

// Get real-time pool value
const poolValue = await oracleClient.getPoolValue();
console.log(`Total pool value: $${poolValue}`);
```

## Security

### API Key Management

- Generate strong random API keys
- Store securely (environment variables, secret managers)
- Rotate periodically
- Use different keys for dev/staging/prod

### NEAR Private Key

- Never commit to version control
- Store in secure environment variables
- Use dedicated NEAR account for oracle
- Keep account funded for MPC signing costs

### TEE Attestation

When deployed to Phala Cloud:
- Oracle runs in Trusted Execution Environment
- Code integrity verified via attestation
- Private keys protected from host OS
- Remote attestation available at `/api/attestation`

## Testing

### Unit Tests
```bash
npm test
```

### Integration Test
```bash
# Test balance aggregation
tsx test-balance-aggregation.ts

# Test deposit with signature (requires vault deployment)
node test-deposit-with-sig.js
```

## Troubleshooting

### "Missing Authorization header"
Ensure API key is included in request header: `Authorization: Bearer YOUR_API_KEY`

### "Oracle API error: 401"
Check that API key matches the one configured in oracle's environment.

### "NEAR transaction failed"
- Verify NEAR account has sufficient balance
- Check NEAR_RPC_URL is accessible
- Ensure NEAR_PRIVATE_KEY is correct

### "Signature verification failed"
- Confirm vault's `AI_AGENT` address matches oracle's agent address
- Verify EIP-712 domain matches vault deployment
- Check signature format (should start with `0x`)

## Development

### Project Structure

```
near-mpc-oracle/
├── src/
│   ├── api/
│   │   └── routes.ts           # API endpoint definitions
│   ├── config/
│   │   └── chains.ts           # Chain configurations & vault addresses
│   ├── middleware/
│   │   └── auth.ts             # API key authentication
│   ├── services/
│   │   ├── balanceFetcher.ts   # Query on-chain balances
│   │   ├── nearMpcService.ts   # NEAR MPC signing
│   │   ├── oracleService.ts    # Main orchestration
│   │   └── vaultService.ts     # Vault contract interactions
│   ├── utils/
│   │   └── logger.ts           # Logging configuration
│   └── server.ts               # Entry point
├── test/
│   └── integration.test.ts     # Integration tests
├── env.example                 # Environment template
├── Dockerfile                  # Docker build configuration
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Chains

1. Update `src/config/chains.ts`:
```typescript
export const SUPPORTED_CHAINS = {
  // ...existing chains
  newChain: {
    chainId: 12345,
    name: 'New Chain',
    rpcUrl: process.env.NEW_CHAIN_RPC || '',
    vaultAddress: '0x...',
    aTokenAddress: '0x...',
  },
};
```

2. Add RPC URL to `env.example` and `.env`

3. Test balance fetching and signing

## License

MIT

## Support

For issues or questions:
- GitHub Issues: [repository-url]/issues
- Documentation: This README

## Status

Production ready. Successfully tested on:
- Base Sepolia testnet
- Arbitrum Sepolia testnet
- Ethereum Sepolia testnet

Mainnet deployment requires:
- Mainnet vault contracts
- Mainnet RPC endpoints
- Production NEAR account
