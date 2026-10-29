import { logger } from './logger';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class RpcCircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttempt = 0;

  constructor(private readonly options: CircuitBreakerOptions = { failureThreshold: 3, resetTimeoutMs: 10000 }) {}

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now > this.nextAttempt) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - Soroban RPC request blocked');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      return result;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = now + this.options.resetTimeoutMs;
        logger.warn(`Circuit breaker tripped to OPEN state for ${this.options.resetTimeoutMs}ms`);
      }
      throw err;
    }
  }

  public reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  public getState(): string {
    return this.state;
  }
}

export const globalRpcBreaker = new RpcCircuitBreaker();
