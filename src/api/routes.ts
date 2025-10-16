import { Router, Request, Response } from 'express';
import { OracleService } from '../services/oracleService';
import { logger } from '../utils/logger';

const router = Router();
const oracleService = new OracleService();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    service: 'near-mpc-oracle',
    timestamp: new Date().toISOString()
  });
});

// POST /api/oracle/balance-snapshot - Generate signed balance snapshot for deposit
router.post('/api/oracle/balance-snapshot', async (req: Request, res: Response) => {
  try {
    const { assets, receiver, vaultChainId } = req.body;

    // Validate required fields
    if (!assets || !receiver || !vaultChainId) {
      return res.status(400).json({
        error: 'Missing required fields: assets, receiver, vaultChainId',
      });
    }

    // Validate receiver address
    if (!/^0x[a-fA-F0-9]{40}$/.test(receiver)) {
      return res.status(400).json({
        error: 'Invalid receiver address',
      });
    }

    logger.info(`Balance snapshot request: assets=${assets}, receiver=${receiver}, chain=${vaultChainId}`);

    // Generate signed snapshot
    const snapshot = await oracleService.generateBalanceSnapshot(
      assets,
      receiver,
      vaultChainId
    );

    logger.info('Balance snapshot generated successfully');

    res.json(snapshot);
  } catch (error: any) {
    logger.error('Balance snapshot error:', error);
    res.status(500).json({
      error: 'Failed to generate balance snapshot',
      message: error.message,
    });
  }
});

// GET /api/oracle/pool-value - Get total pool value (aTokens + USDC across all chains)
router.get('/api/oracle/pool-value', async (req: Request, res: Response) => {
  try {
    const vaultChainId = req.query.vaultChainId 
      ? parseInt(req.query.vaultChainId as string) 
      : undefined;

    logger.info(`Pool value request${vaultChainId ? ` for chain ${vaultChainId}` : ''}`);

    const poolValue = await oracleService.getPoolValue(vaultChainId);

    logger.info('Pool value calculated successfully');

    res.json(poolValue);
  } catch (error: any) {
    logger.error('Pool value error:', error);
    res.status(500).json({
      error: 'Failed to get pool value',
      message: error.message,
    });
  }
});

// GET /api/oracle/agent-address - Get agent's EVM address
router.get('/api/oracle/agent-address', async (req: Request, res: Response) => {
  try {
    const address = await oracleService.getAgentAddress();
    res.json({ agentAddress: address });
  } catch (error: any) {
    logger.error('Agent address error:', error);
    res.status(500).json({
      error: 'Failed to get agent address',
      message: error.message,
    });
  }
});

export default router;

