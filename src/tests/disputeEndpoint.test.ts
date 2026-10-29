import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Escrow Dispute Endpoint Tests', () => {
  const app = createApp();

  it('POST /api/v1/escrow/orders/:orderId/dispute should accept valid dispute', async () => {
    const res = await request(app)
      .post('/api/v1/escrow/orders/123/dispute')
      .send({ reason: 'Quality inspection failed at atelier', requestedRefundBps: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe(123);
    expect(res.body.data.status).toBe('DisputeSubmitted');
  });

  it('POST /api/v1/escrow/orders/:orderId/dispute should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/escrow/orders/123/dispute')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_PAYLOAD');
  });
});
