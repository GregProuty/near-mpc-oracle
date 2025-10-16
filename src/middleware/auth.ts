import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * API Key authentication middleware
 * Expects: Authorization: Bearer <API_KEY>
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for health endpoint
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn(`Auth failed: Missing Authorization header from ${req.ip}`);
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    logger.warn(`Auth failed: Invalid Authorization format from ${req.ip}`);
    res.status(401).json({ error: 'Invalid Authorization format. Expected: Bearer <token>' });
    return;
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    logger.error('API_KEY not configured in environment');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (token !== apiKey) {
    logger.warn(`Auth failed: Invalid API key from ${req.ip}`);
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  // Auth successful
  next();
}

