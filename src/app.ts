import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health';
import networkRouter from './routes/network';
import protocolRouter from './routes/protocol';
import validationRouter from './routes/validation';
import { logger } from './utils/logger';

export function createApp(): express.Application {
  const app = express();

  // Security and middleware
  app.use(helmet());
  app.use(
    cors({
      origin: '*', // Allow frontend client requests
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json());

  // Request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug(`Incoming ${req.method} ${req.url}`);
    next();
  });

  // Mount routes
  app.use('/health', healthRouter);
  app.use('/api/v1/network', networkRouter);
  app.use('/api/v1/protocol', protocolRouter);
  app.use('/api/v1/validate', validationRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found on Stellar Threads core service',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled internal server error', {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred',
      },
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
