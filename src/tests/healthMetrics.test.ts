import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Health & Metrics Endpoint Tests', () => {
  const app = createApp();

  it('GET /api/v1/health should respond with protocol readiness', async () => {
    const res = await request(app).get('/api/v1/health');
    // res.status can be 200 or 503 depending on horizon testnet ping in local CI
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('stellar-threads-core');
    expect(res.body.data.protocol22Ready).toBe(true);
  });

  it('GET /metrics should expose Prometheus formatted metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('stellar_threads_uptime_seconds');
    expect(res.text).toContain('stellar_threads_rpc_circuit_state');
  });
});
