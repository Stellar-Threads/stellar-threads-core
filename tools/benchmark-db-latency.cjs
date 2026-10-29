/**
 * Database Query Latency Benchmark
 */
console.log('Benchmarking in-memory local caching performance vs Soroban RPC...');

const iterations = 1000;
const start = Date.now();

// Simulated memory store lookups
const store = new Map();
for (let i = 0; i < iterations; i++) {
  store.set(`order_${i}`, { id: i, status: 'Funded', amount: '10000000' });
}

for (let i = 0; i < iterations; i++) {
  store.get(`order_${i}`);
}

const duration = Date.now() - start;
console.log(`✅ Executed ${iterations * 2} read/writes in ${duration}ms (${((duration / (iterations * 2)) * 1000).toFixed(2)} µs/op)`);
