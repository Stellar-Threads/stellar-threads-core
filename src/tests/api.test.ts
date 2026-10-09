import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Stellar Threads Core API Endpoints', () => {
  it('GET /api/v1/network should return valid Stellar Testnet configuration', async () => {
    const res = await request(app).get('/api/v1/network');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.network).toBe('testnet');
    expect(res.body.data.networkPassphrase).toBe('Test SDF Network ; September 2015');
    expect(res.body.data.horizonUrl).toContain('horizon-testnet.stellar.org');
  });

  it('GET /api/v1/protocol should return protocol metadata and modules roadmap', async () => {
    const res = await request(app).get('/api/v1/protocol');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Stellar Threads');
    expect(res.body.data.modules.length).toBeGreaterThan(0);
    expect(res.body.data.modules[0].status).toBe('active');
  });

  it('POST /api/v1/validate/address should validate valid Stellar G-address', async () => {
    const res = await request(app)
      .post('/api/v1/validate/address')
      .send({ address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
  });

  it('POST /api/v1/validate/address should reject invalid address', async () => {
    const res = await request(app)
      .post('/api/v1/validate/address')
      .send({ address: 'invalid-stellar-address' });

    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(false);
    expect(res.body.data.error).toBeDefined();
  });

  it('POST /api/v1/validate/payment should accept valid payment payload', async () => {
    const res = await request(app)
      .post('/api/v1/validate/payment')
      .send({
        fromAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        toAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amountXlm: '25.5',
        memo: 'Fashion atelier order',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.errors).toHaveLength(0);
    expect(res.body.data.sanitized.estimatedBaseFeeXlm).toBeDefined();
  });

  it('POST /api/v1/validate/payment should reject identical sender and recipient', async () => {
    const sameAddress = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    const res = await request(app)
      .post('/api/v1/validate/payment')
      .send({
        fromAddress: sameAddress,
        toAddress: sameAddress,
        amountXlm: '10',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(false);
    expect(res.body.data.errors.some((e: string) => e.includes('identical'))).toBe(true);
  });
});
