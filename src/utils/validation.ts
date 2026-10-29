import { StrKey } from '@stellar/stellar-sdk';

export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AmountValidationResult {
  isValid: boolean;
  error?: string;
  parsedAmount?: number;
}

export interface MemoValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedMemo?: string;
}

/**
 * Validates a Stellar public key (G-address format, ed25519 public key)
 */
export function validateStellarAddress(address: unknown): AddressValidationResult {
  if (typeof address !== 'string' || !address.trim()) {
    return { isValid: false, error: 'Address is required and must be a string' };
  }

  const trimmed = address.trim();

  if (!trimmed.startsWith('G')) {
    return { isValid: false, error: 'Stellar account addresses must begin with "G"' };
  }

  if (trimmed.length !== 56) {
    return {
      isValid: false,
      error: `Invalid address length (${trimmed.length} characters). Standard Stellar address is 56 characters.`,
    };
  }

  try {
    const isEd25519 = StrKey.isValidEd25519PublicKey(trimmed);
    if (!isEd25519) {
      return { isValid: false, error: 'Address failed Stellar ed25519 checksum verification' };
    }
    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: 'Malformed Stellar public address' };
  }
}

/**
 * Validates native XLM payment amount (positive, max 7 decimals, within bounds)
 */
export function validateXlmAmount(amountStr: unknown, availableBalance?: number): AmountValidationResult {
  if (typeof amountStr !== 'string' && typeof amountStr !== 'number') {
    return { isValid: false, error: 'Amount is required' };
  }

  const str = String(amountStr).trim();
  if (!str) {
    return { isValid: false, error: 'Amount cannot be empty' };
  }

  const num = parseFloat(str);

  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: 'Amount must be a valid numeric value' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Amount must be greater than zero' };
  }

  // Stellar precision: up to 7 decimal places (1 stroop = 0.0000001 XLM)
  const parts = str.split('.');
  if (parts.length > 2) {
    return { isValid: false, error: 'Amount contains multiple decimal points' };
  }
  if (parts.length === 2 && parts[1].length > 7) {
    return {
      isValid: false,
      error: 'Stellar precision limit exceeded (maximum 7 decimal digits allowed)',
    };
  }

  if (availableBalance !== undefined) {
    const minReserveBuffer = 1.0; // Reserve for account + network fee
    const spendable = Math.max(0, availableBalance - minReserveBuffer);
    if (num > spendable) {
      return {
        isValid: false,
        error: `Insufficient funds. Available: ${availableBalance} XLM (spendable: ~${spendable.toFixed(4)} XLM after 1.0 XLM minimum reserve)`,
        parsedAmount: num,
      };
    }
  }

  return { isValid: true, parsedAmount: num };
}

/**
 * Validates Stellar transaction memo constraints:
 * - MemoText: up to 28 bytes UTF-8
 * - MemoId: 64-bit unsigned integer
 * - MemoHash: 32 bytes (64 hex characters)
 */
export function validateMemo(memo?: string, memoType: 'text' | 'id' | 'hash' = 'text'): MemoValidationResult {
  if (!memo || !memo.trim()) {
    return { isValid: true };
  }

  const trimmed = memo.trim();

  if (memoType === 'text') {
    const byteLength = Buffer.byteLength(trimmed, 'utf8');
    if (byteLength > 28) {
      return {
        isValid: false,
        error: `Memo text exceeds 28 bytes (${byteLength} bytes provided)`,
      };
    }
    return { isValid: true, sanitizedMemo: trimmed };
  }

  if (memoType === 'id') {
    if (!/^\d+$/.test(trimmed)) {
      return { isValid: false, error: 'Memo ID must be a positive integer' };
    }
    try {
      const big = BigInt(trimmed);
      const maxUint64 = BigInt('18446744073709551615');
      if (big < 0n || big > maxUint64) {
        return { isValid: false, error: 'Memo ID out of range for 64-bit unsigned integer' };
      }
      return { isValid: true, sanitizedMemo: trimmed };
    } catch {
      return { isValid: false, error: 'Invalid Memo ID integer format' };
    }
  }

  if (memoType === 'hash') {
    if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return { isValid: false, error: 'Memo Hash must be exactly 32 bytes hex (64 characters)' };
    }
    return { isValid: true, sanitizedMemo: trimmed.toLowerCase() };
  }

  return { isValid: false, error: 'Unsupported memo type' };
}

export function validateBasisPoints(bps: number): boolean {
  return Number.isInteger(bps) && bps >= 0 && bps <= 10000;
}

export function validateStroopAmount(amountStr: string): boolean {
  try {
    const val = BigInt(amountStr);
    return val > 0n;
  } catch {
    return false;
  }
}
