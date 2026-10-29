/**
 * Channel Pool Stress Test Harness
 * Simulates concurrent parallel acquisition and release across multiple worker threads.
 */
const { StellarChannelManager } = require('../dist/services/channelManager');

async function runStress() {
  console.log('Starting Channel Pool 100-operation concurrency benchmark...');
  const pool = Array.from({ length: 8 }, (_, i) => `GCHANNEL_TEST_KEY_${i + 1}`);
  const manager = new StellarChannelManager(pool);

  const start = Date.now();
  const operations = 100;
  let acquiredCount = 0;

  const tasks = Array.from({ length: operations }, async () => {
    const ch = await manager.acquireChannel();
    if (ch) {
      acquiredCount++;
      await new Promise(r => setTimeout(r, 2)); // simulate tx dispatch
      manager.releaseChannel(ch.publicKey);
    }
  });

  await Promise.all(tasks);
  const duration = (Date.now() - start) / 1000;
  console.log(`✅ Processed ${acquiredCount} channel acquisitions in ${duration.toFixed(2)}s (${(operations / duration).toFixed(1)} ops/sec)`);
}

if (require.main === module) runStress();
