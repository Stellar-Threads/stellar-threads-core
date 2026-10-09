import { describe, it, expect } from 'vitest';
import { validateStellarAddress, validateXlmAmount, validateMemo } from '../utils/validation';

describe('Stellar Validation Utilities', () => {
  // Real valid Stellar testnet public address
  const validAddress = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
  const validAddress2 = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  describe('validateStellarAddress', () => {
    it('should validate standard ed25519 public keys starting with G', () => {
      const result = validateStellarAddress(validAddress);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate another valid Stellar address', () => {
      const result = validateStellarAddress(validAddress2);
      expect(result.isValid).toBe(true);
    });

    it('should reject non-G addresses (e.g. secret keys starting with S or Ethereum 0x)', () => {
      const secretKey = 'SB2K4E7J2O...';
      const ethAddress = '0x71C...';
      expect(validateStellarAddress(secretKey).isValid).toBe(false);
      expect(validateStellarAddress(ethAddress).isValid).toBe(false);
    });

    it('should reject malformed or invalid length addresses', () => {
      expect(validateStellarAddress('G123').isValid).toBe(false);
      expect(validateStellarAddress('').isValid).toBe(false);
      expect(validateStellarAddress(null).isValid).toBe(false);
    });

    it('should reject addresses that fail ed25519 checksum', () => {
      const corruptAddress = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZV0';
      expect(validateStellarAddress(corruptAddress).isValid).toBe(false);
    });
  });

  describe('validateXlmAmount', () => {
    it('should accept valid positive numbers and strings', () => {
      expect(validateXlmAmount('10').isValid).toBe(true);
      expect(validateXlmAmount('0.5').isValid).toBe(true);
      expect(validateXlmAmount('100.1234567').isValid).toBe(true);
    });

    it('should reject negative, zero, and empty amounts', () => {
      expect(validateXlmAmount('0').isValid).toBe(false);
      expect(validateXlmAmount('-5').isValid).toBe(false);
      expect(validateXlmAmount('').isValid).toBe(false);
      expect(validateXlmAmount('abc').isValid).toBe(false);
    });

    it('should reject numbers with more than 7 decimal places (Stellar stroop constraint)', () => {
      expect(validateXlmAmount('1.12345678').isValid).toBe(false);
    });

    it('should enforce available balance with reserve deduction', () => {
      // With 10 XLM balance, reserve buffer is 1.0 XLM, spendable is 9.0 XLM
      expect(validateXlmAmount('5', 10).isValid).toBe(true);
      expect(validateXlmAmount('9.5', 10).isValid).toBe(false);
    });
  });

  describe('validateMemo', () => {
    it('should allow empty memo', () => {
      expect(validateMemo(undefined).isValid).toBe(true);
      expect(validateMemo('').isValid).toBe(true);
    });

    it('should validate text memo within 28 bytes', () => {
      expect(validateMemo('Order #123', 'text').isValid).toBe(true);
      expect(validateMemo('StellarThreads-2026', 'text').isValid).toBe(true);
    });

    it('should reject text memo exceeding 28 bytes', () => {
      const longText = 'This is an excessively long memo for a Stellar payment transaction';
      const result = validateMemo(longText, 'text');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds 28 bytes');
    });

    it('should validate memo ID as uint64', () => {
      expect(validateMemo('123456789', 'id').isValid).toBe(true);
      expect(validateMemo('-1', 'id').isValid).toBe(false);
      expect(validateMemo('not-a-number', 'id').isValid).toBe(false);
    });
  });
});
