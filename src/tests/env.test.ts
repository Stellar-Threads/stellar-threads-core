import { describe, it, expect } from 'vitest';
import { loadEnvConfig } from '../config/env';

describe('Environment Config Tests', () => {
  it('should load default environment configurations safely', () => {
    const conf = loadEnvConfig();
    expect(conf.stellarNetwork).toBe('testnet');
    expect(conf.sorobanRpcUrl).toContain('stellar.org');
    expect(conf.port).toBeGreaterThan(0);
  });
});
