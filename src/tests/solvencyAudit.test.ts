import { describe, it, expect } from 'vitest';
import { SolvencyAuditor } from '../services/solvencyAudit';

describe('SolvencyAuditor Unit Tests', () => {
  it('should certify solvency when reserves exceed liabilities', () => {
    const auditor = new SolvencyAuditor();
    const report = auditor.auditReserves(150000000n, 100000000n);
    expect(report.isSolvent).toBe(true);
    expect(report.surplusStroops).toBe('50000000');
    expect(report.reserveRatioPercent).toBe('150.00');
  });

  it('should detect deficit when reserves fall short', () => {
    const auditor = new SolvencyAuditor();
    const report = auditor.auditReserves(80000000n, 100000000n);
    expect(report.isSolvent).toBe(false);
  });
});
