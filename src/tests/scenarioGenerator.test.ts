import { describe, it, expect } from 'vitest';
import { generateSyntheticFashionScenario } from '../test-utils/scenarioGenerator';

describe('Scenario Generator Utility Tests', () => {
  it('should generate deterministic synthetic fashion scenario', () => {
    const s1 = generateSyntheticFashionScenario(1);
    const s2 = generateSyntheticFashionScenario(1);

    expect(s1).toEqual(s2);
    expect(s1.brandName).toBe('Atelier Stellar Haute 001');
    expect(s1.orderId).toBe(1001);
  });
});
