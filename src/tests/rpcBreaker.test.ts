import { describe, it, expect } from 'vitest';
import { RpcCircuitBreaker } from '../utils/rpcBreaker';

describe('RpcCircuitBreaker Unit Tests', () => {
  it('should remain CLOSED upon successful executions', async () => {
    const breaker = new RpcCircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });
    const result = await breaker.execute(async () => 'OK');
    expect(result).toBe('OK');
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('should trip to OPEN state upon reaching failure threshold', async () => {
    const breaker = new RpcCircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 5000 });
    await expect(breaker.execute(async () => { throw new Error('RPC_ERR'); })).rejects.toThrow('RPC_ERR');
    await expect(breaker.execute(async () => { throw new Error('RPC_ERR'); })).rejects.toThrow('RPC_ERR');
    expect(breaker.getState()).toBe('OPEN');
  });
});
