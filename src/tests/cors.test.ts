import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('CORS Whitelist Middleware', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('allows requests without origin header (server-to-server / curl)', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/network');
    expect(res.status).toBe(200);
  });

  it('allows localhost origin in development mode', async () => {
    process.env.NODE_ENV = 'development';
    const app = createApp();
    const res = await request(app)
      .get('/api/v1/network')
      .set('Origin', 'http://localhost:3000');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('allows production whitelisted origin', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://stellar-threads-app.netlify.app';
    const app = createApp();
    const res = await request(app)
      .get('/api/v1/network')
      .set('Origin', 'https://stellar-threads-app.netlify.app');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://stellar-threads-app.netlify.app');
  });

  it('rejects unauthorized origin with 403 in production mode', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://stellar-threads-app.netlify.app';
    const app = createApp();
    const res = await request(app)
      .get('/api/v1/network')
      .set('Origin', 'https://malicious-site.com');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_ORIGIN');
  });
});