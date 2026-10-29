import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function centralizedErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  logger.error('Centralized error caught', { error: message });

  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message,
    },
    timestamp: new Date().toISOString(),
  });
}
