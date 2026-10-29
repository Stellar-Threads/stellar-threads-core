/**
 * SHA-256 Hashing Throughput Benchmark
 */
const crypto = require('crypto');

console.log('Benchmarking SHA-256 garment digital twin hashing throughput...');
const iterations = 50000;
const payload = 'GARMENT_PASSPORT_AUTHENTICITY_PAYLOAD_TESTNET_2026';
const start = Date.now();

for (let i = 0; i < iterations; i++) {
  crypto.createHash('sha256').update(payload + i).digest('hex');
}

const duration = (Date.now() - start) / 1000;
console.log(`✅ Computed ${iterations.toLocaleString()} SHA-256 hashes in ${duration.toFixed(2)}s (${(iterations / duration).toLocaleString(undefined, { maximumFractionDigits: 0 })} hashes/sec)`);
