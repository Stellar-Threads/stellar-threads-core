import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health';
import networkRouter from './routes/network';
import protocolRouter from './routes/protocol';
import validationRouter from './routes/validation';
import eventsRouter from './routes/events';
import designersRouter from './routes/designers';
import passportsRouter from './routes/passports';
import escrowRouter from './routes/escrow';
import indexerRouter from './routes/indexer';
import { financingRouter } from './routes/financing';
import { getCorsOptions } from './config/cors';
import { logger } from './utils/logger';

export function createApp(): express.Application {
  const app = express();

  // Security and middleware
  app.use(helmet());
  app.use(cors(getCorsOptions()));
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
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/designers', designersRouter);
  app.use('/api/v1/passports', passportsRouter);
  app.use('/api/v1/escrow', escrowRouter);
  app.use('/api/v1/financing', financingRouter);
  app.use('/api/v1/indexer', indexerRouter);

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
    const isCorsError = err instanceof Error && err.message.includes('CORS');
    logger.error('Unhandled internal server error', {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(isCorsError ? 403 : 500).json({
      success: false,
      error: {
        code: isCorsError ? 'FORBIDDEN_ORIGIN' : 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected internal error occurred',
      },
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}