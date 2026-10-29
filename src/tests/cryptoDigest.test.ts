import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Garment NFC Cryptographic Digest Test Harness', () => {
  it('should generate consistent SHA-256 hex digest for garment digital twins', () => {
    const payload = JSON.stringify({
      productId: 'PARIS-FW26-001',
      fabric: 'Bio-Silk GOTS 100%',
      atelier: 'Maison de Stellar',
      batch: '2026-B12',
    });

    const hash1 = crypto.createHash('sha256').update(payload).digest('hex');
    const hash2 = crypto.createHash('sha256').update(payload).digest('hex');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should detect tampering in physical garment metadata', () => {
    const original = JSON.stringify({ productId: 'PARIS-FW26-001', fabric: 'Bio-Silk' });
    const tampered = JSON.stringify({ productId: 'PARIS-FW26-001', fabric: 'Polyester' });

    const hashOriginal = crypto.createHash('sha256').update(original).digest('hex');
    const hashTampered = crypto.createHash('sha256').update(tampered).digest('hex');

    expect(hashOriginal).not.toBe(hashTampered);
  });
});
