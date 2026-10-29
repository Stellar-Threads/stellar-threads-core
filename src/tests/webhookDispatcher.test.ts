import { describe, it, expect } from 'vitest';
import { WebhookDispatcher } from '../services/webhookDispatcher';

describe('WebhookDispatcher Tests', () => {
  const dispatcher = new WebhookDispatcher('test_secret_key');

  it('should sign and verify valid payload', () => {
    const payload = JSON.stringify({ event: 'escrow.funded', orderId: 101 });
    const sig = dispatcher.generateSignature(payload);

    expect(dispatcher.verifySignature(payload, sig)).toBe(true);
  });

  it('should reject tampered payload', () => {
    const original = JSON.stringify({ event: 'escrow.funded', orderId: 101 });
    const tampered = JSON.stringify({ event: 'escrow.funded', orderId: 999 });
    const sig = dispatcher.generateSignature(original);

    expect(dispatcher.verifySignature(tampered, sig)).toBe(false);
  });
});
