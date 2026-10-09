import { createApp } from './app';
import { logger } from './utils/logger';
import { getNetworkConfig } from './config/stellar';
import { eventIndexer } from './indexer/eventIndexer';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

try {
  const config = getNetworkConfig();
  logger.info('Stellar configuration verified', {
    network: config.network,
    horizonUrl: config.horizonUrl,
    passphrase: config.networkPassphrase,
  });

  const app = createApp();

  const server = app.listen(PORT, HOST, async () => {
    logger.info(`Stellar Threads Core Service running on http://${HOST}:${PORT}`, {
      port: PORT,
      host: HOST,
      environment: process.env.NODE_ENV || 'development',
    });

    try {
      await eventIndexer.start();
    } catch (err) {
      logger.warn('Event indexer auto-start notice', { err });
    }
  });

  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    try {
      eventIndexer.stop();
    } catch {}
    server.close(() => {
      logger.info('Server terminated cleanly');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (err) {
  logger.error('Failed to initialize Stellar Threads Core Service', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
}
