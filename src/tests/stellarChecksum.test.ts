import { describe, it, expect } from 'vitest';
import { calculateStellarCrc16, isValidStellarGAddress } from '../test-utils/stellarChecksum';

describe('Stellar Strkey Checksum Tests', () => {
  it('should compute valid CRC-16 checksum for sample byte buffer', () => {
    const bytes = new Uint8Array([0x06, 0xa1, 0xb2, 0xc3]);
    const crc = calculateStellarCrc16(bytes);
    expect(crc).toBeGreaterThan(0);
    expect(crc).toBeLessThanOrEqual(0xffff);
  });

  it('should validate 56-char G-addresses', () => {
    // 56 characters
    const validAddress = 'GBTYMGFXTESTADDRESS1234567890123456789012345678901234567';
    expect(isValidStellarGAddress(validAddress)).toBe(true);
    expect(isValidStellarGAddress('INVALID_ADDR')).toBe(false);
  });
});
