import { describe, it, expect } from 'vitest';
import { ProvenanceService } from '../services/provenanceService';

describe('ProvenanceService Unit Tests', () => {
  it('should generate consistent deterministic SHA-256 twin hashes', () => {
    const service = new ProvenanceService();
    const hash1 = service.generateTwinHash('P1', 'Brand', 'Silk', 'SN001');
    const hash2 = service.generateTwinHash('P1', 'Brand', 'Silk', 'SN001');
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });
});
