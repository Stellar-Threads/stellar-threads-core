import { eventIndexer } from '../indexer/eventIndexer';
import { logger } from '../utils/logger';

async function main() {
  logger.info('Starting real-time Soroban event watcher on Stellar Testnet...');
  eventIndexer.subscribe(event => {
    logger.info(`[EVENT STREAM] ${event.contractName} -> ${event.eventType} (Ledger: ${event.ledger})`, {
      data: event.data,
      txHash: event.txHash,
    });
  });

  await eventIndexer.start();
}

if (require.main === module) {
  main().catch(err => logger.error('Watcher crashed', { error: String(err) }));
}
