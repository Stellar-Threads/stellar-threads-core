import { describe, it, expect } from 'vitest';
import { sanitizeString } from '../utils/sanitizer';

describe('Input Sanitizer Tests', () => {
  it('should strip script tags from user input', () => {
    const malicious = 'Maison de Stellar<script>alert("hack")</script>';
    expect(sanitizeString(malicious)).toBe('Maison de Stellar');
  });

  it('should strip angle brackets', () => {
    const html = 'Atelier <b>Haute</b> Couture';
    expect(sanitizeString(html)).toBe('Atelier bHaute/b Couture');
  });
});
