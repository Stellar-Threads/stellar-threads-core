import { describe, it, expect } from 'vitest';
import { getNetworkConfig } from '../config/stellar';
import { SolvencyAuditor } from '../services/solvencyAudit';

describe('Final Protocol Sanity & Certification Tests', () => {
  it('should verify testnet network configuration integrity', () => {
    const config = getNetworkConfig();
    expect(config.network).toBe('testnet');
    expect(config.rpcUrl).toContain('soroban-testnet.stellar.org');
    expect(config.networkPassphrase).toBe('Test SDF Network ; September 2015');
  });

  it('should verify protocol solvency auditor executes without errors', async () => {
    const auditor = new SolvencyAuditor();
    const report = await auditor.performFullAudit();
    expect(report.isSolvent).toBe(true);
    expect(report.escrowReserveRatio).toBe(1.0);
  });
});
