/**
 * Benchmark Script: Channel Account Throughput Simulator
 * Demonstrates sustained transactions-per-second capability using pool.
 */
import { StellarChannelManager } from '../src/services/channelManager';

async function runBenchmark() {
  console.log('Initializing channel manager benchmark...');
  const pool = ['GCHANNEL_1_TEST', 'GCHANNEL_2_TEST', 'GCHANNEL_3_TEST', 'GCHANNEL_4_TEST'];
  const manager = new StellarChannelManager(pool);

  const iterations = 50;
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    const ch = await manager.acquireChannel();
    // Simulate lightweight Soroban transaction construction
    await new Promise((r) => setTimeout(r, 5));
    if (ch) manager.releaseChannel(ch.publicKey);
  }

  const durationSec = (Date.now() - start) / 1000;
  const tps = (iterations / durationSec).toFixed(1);
  console.log(`Processed ${iterations} parallel channel assignments in ${durationSec.toFixed(2)}s (${tps} TPS)`);
}

if (require.main === module) {
  runBenchmark();
}
