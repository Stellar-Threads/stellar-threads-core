import { describe, it, expect } from 'vitest';
import { SlidingLogRateLimiter } from '../utils/rateLimiterSliding';

describe('SlidingLogRateLimiter Tests', () => {
  it('should allow requests up to the max limit within window', () => {
    const limiter = new SlidingLogRateLimiter(3, 1000);
    expect(limiter.isAllowed(100)).toBe(true);
    expect(limiter.isAllowed(101)).toBe(true);
    expect(limiter.isAllowed(102)).toBe(true);
    expect(limiter.isAllowed(103)).toBe(false); // 4th rejected
  });
});
