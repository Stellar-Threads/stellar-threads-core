import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export class WebhookDispatcher {
  private secret: string;

  constructor(secret = 'stellar_threads_default_secret') {
    this.secret = secret;
  }

  generateSignature(payloadStr: string): string {
    return crypto.createHmac('sha256', this.secret).update(payloadStr).digest('hex');
  }

  verifySignature(payloadStr: string, signature: string): boolean {
    const expected = this.generateSignature(payloadStr);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}

export const webhookDispatcher = new WebhookDispatcher();
