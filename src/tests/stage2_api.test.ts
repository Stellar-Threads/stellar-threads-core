import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Stellar Threads Stage 2 API Endpoints', () => {
  it('GET /api/v1/designers should return designers list and contract ID', async () => {
    const res = await request(app).get('/api/v1/designers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contractId).toBeDefined();
    expect(Array.isArray(res.body.data.designers)).toBe(true);
  });

  it('GET /api/v1/passports should return passports list', async () => {
    const res = await request(app).get('/api/v1/passports');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.passports)).toBe(true);
  });

  it('GET /api/v1/escrow/orders should return orders list', async () => {
    const res = await request(app).get('/api/v1/escrow/orders');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.orders)).toBe(true);
  });

  it('GET /api/v1/events should return indexed events', async () => {
    const res = await request(app).get('/api/v1/events');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.events)).toBe(true);
  });

  it('GET /api/v1/indexer/status should return operational indexer health', async () => {
    const res = await request(app).get('/api/v1/indexer/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pollIntervalMs).toBeDefined();
  });

  it('POST /api/v1/passports/verify should reject missing parameters', async () => {
    const res = await request(app).post('/api/v1/passports/verify').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/designers/prepare-register should reject incomplete payload', async () => {
    const res = await request(app)
      .post('/api/v1/designers/prepare-register')
      .send({ brandName: 'Incomplete' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
