import { describe, it, expect } from 'vitest';
import { generateGarmentSku } from '../utils/idGenerator';

describe('Fashion SKU ID Generator Tests', () => {
  it('should generate formatted SKU conforming to fashion standards', () => {
    const sku = generateGarmentSku('MAISON', 'FW26', 1);
    expect(sku).toBe('MAIS-FW26-0001');
  });
});
