import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('Server Health Check (app.ts separation)', () => {
  it('GET /api/health returns 200 with status ok and brand information', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.brand).toBe('The Bombay Reserve');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.version).toBe('1.0.0');
  });

  it('GET /health also returns 200 health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
