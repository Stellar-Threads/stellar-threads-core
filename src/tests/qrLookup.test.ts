import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Passport QR Lookup Tests', () => {
  const app = createApp();

  it('GET /api/v1/passports/qr/:productId should return verification URL', async () => {
    const res = await request(app).get('/api/v1/passports/qr/PARIS-FW26-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.productId).toBe('PARIS-FW26-001');
    expect(res.body.data.qrVerificationUrl).toContain('PARIS-FW26-001');
    expect(res.body.data.nfcScanProtocol).toBe('NDEF-URI-V1');
  });
});
