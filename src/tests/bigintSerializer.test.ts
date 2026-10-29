import { describe, it, expect } from 'vitest';
import { stringifyWithBigInt } from '../utils/bigintSerializer';

describe('BigInt Serializer Tests', () => {
  it('should serialize object containing BigInt without throwing TypeError', () => {
    const payload = { stroops: 1000000000000n, label: 'TVL' };
    const serialized = stringifyWithBigInt(payload);
    expect(serialized).toContain('"stroops":"1000000000000"');
    expect(serialized).toContain('"label":"TVL"');
  });
});
