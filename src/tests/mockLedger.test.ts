import { describe, it, expect } from 'vitest';
import { MockSorobanEnvironment } from '../test-utils/mockLedger';

describe('MockSorobanEnvironment Tests', () => {
  it('should advance ledgers and simulate closing timestamps', () => {
    const env = new MockSorobanEnvironment(500);
    expect(env.getState().currentLedger).toBe(500);

    env.advanceLedger(10);
    expect(env.getState().currentLedger).toBe(510);
  });
});
