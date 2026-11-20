import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

describe('Standardized Error Format Verification', () => {
  it('enforces { error: { code, message, details? } } on 404 route not found', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error.code).toBe('string');
    expect(typeof res.body.error.message).toBe('string');
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('enforces { error: { code, message, details? } } on malformed JSON payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"bad-json": ');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('MALFORMED_JSON');
    expect(typeof res.body.error.message).toBe('string');
  });
});
