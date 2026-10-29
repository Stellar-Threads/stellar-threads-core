import { logger } from './logger';

export function setupGracefulShutdown(server?: { close: (cb: () => void) => void }): void {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed cleanly. Exiting process.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
