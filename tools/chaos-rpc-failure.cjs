/**
 * Chaos Testing: Simulate Soroban RPC Fault Injection
 */
const { RpcCircuitBreaker } = require('../dist/utils/rpcBreaker');

async function runChaos() {
  console.log('Simulating RPC fault injection & circuit breaker tripping...');
  const breaker = new RpcCircuitBreaker(3, 1000);

  // Inject 3 consecutive failures
  for (let i = 0; i < 3; i++) {
    try {
      await breaker.execute(async () => {
        throw new Error('Simulated RPC 504 Gateway Timeout');
      });
    } catch {
      // Expected
    }
  }

  console.log('Circuit breaker state after 3 failures:', breaker.getState());
  if (breaker.getState() !== 'OPEN') {
    throw new Error('Circuit breaker failed to trip to OPEN state!');
  }

  console.log('✅ Chaos RPC fault injection verified circuit breaker safety.');
}

if (require.main === module) runChaos();
