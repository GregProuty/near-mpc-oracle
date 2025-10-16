// Load environment FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { logger } from './utils/logger';
import { initializeNearMpc } from './services/nearMpcService';
import { apiKeyAuth } from './middleware/auth';
import routes from './api/routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Key authentication
app.use(apiKeyAuth);

// Routes
app.use(routes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
async function start() {
  try {
    logger.info('Starting NEAR MPC Oracle');

    // Validate environment
    const requiredEnv = [
      'API_KEY',
      'NEAR_ACCOUNT_ID',
      'NEAR_PRIVATE_KEY',
      'ETHEREUM_SEPOLIA_RPC',
      'BASE_SEPOLIA_RPC',
      'ARBITRUM_SEPOLIA_RPC',
    ];

    for (const env of requiredEnv) {
      if (!process.env[env]) {
        throw new Error(`Missing required environment variable: ${env}`);
      }
    }

    // Initialize NEAR MPC
    logger.info('Initializing NEAR MPC');
    initializeNearMpc();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Oracle running on port ${PORT}`);
      logger.info(`Endpoints:`);
      logger.info(`   GET  /health`);
      logger.info(`   POST /api/oracle/balance-snapshot`);
      logger.info(`   GET  /api/oracle/pool-value`);
      logger.info(`   GET  /api/oracle/agent-address`);
      logger.info('');
      logger.info('NEAR MPC signing enabled');
      logger.info(`   MPC Contract: v1.signer-prod.testnet`);
      logger.info(`   Path: ethereum-1`);
    });
  } catch (error) {
    logger.error('Failed to start oracle:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start
start();

