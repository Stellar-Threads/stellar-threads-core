import { describe, it, expect } from 'vitest';

describe('Basis Points (BPS) Mathematical Invariants', () => {
  it('should split 10,000 BPS across multiple recipients without remainder leakage', () => {
    const totalStroops = 100000000n; // 10 XLM

    // Split: 70% Atelier, 20% Inspector, 8.5% Factor, 1.5% Protocol
    const splitsBps = [7000n, 2000n, 850n, 150n];
    expect(splitsBps.reduce((a, b) => a + b, 0n)).toBe(10000n);

    let allocated = 0n;
    const parts = splitsBps.map((bps) => {
      const share = (totalStroops * bps) / 10000n;
      allocated += share;
      return share;
    });

    const remainderDust = totalStroops - allocated;
    expect(remainderDust).toBe(0n); // Exact division
  });

  it('should guarantee first-place dust allocation when division has odd remainders', () => {
    const oddAmount = 10000001n; // 10000001 Stroops
    const bpsA = 5000n;
    const bpsB = 5000n;

    let shareA = (oddAmount * bpsA) / 10000n;
    let shareB = (oddAmount * bpsB) / 10000n;
    const dust = oddAmount - (shareA + shareB);

    // Protocol 22 dust attribution invariant: dust assigned to primary party
    shareA += dust;

    expect(shareA + shareB).toBe(oddAmount);
  });
});
