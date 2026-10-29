import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Analytics & ROI API Integration Tests', () => {
  const app = createApp();

  it('GET /api/v1/analytics/overview should return protocol statistics', async () => {
    const res = await request(app).get('/api/v1/analytics/overview');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.protocolVersion).toBe('Protocol 22');
  });

  it('POST /api/v1/financing/calculate-roi should calculate factoring returns', async () => {
    const res = await request(app)
      .post('/api/v1/financing/calculate-roi')
      .send({ principalStroops: '100000000', yieldBps: 1000, durationDays: 365 });

    expect(res.status).toBe(200);
    expect(res.body.data.estimatedYieldStroops).toBe('10000000');
    expect(res.body.data.effectiveApyPercent).toBe('10.00');
  });
});
