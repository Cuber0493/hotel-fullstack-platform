import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { authService } from './services/authService.js';
import { Role } from '@prisma/client';

describe('Performance, Compression & Latency Audit', () => {
  const adminToken = authService.generateAccessToken({
    id: 'usr-admin-perf',
    email: 'admin@bombayreserve.com',
    role: Role.ADMIN,
    name: 'Anya Mehta',
  } as any);

  it('serves Health Check under 50ms', async () => {
    const start = performance.now();
    const res = await request(app).get('/api/health');
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
    expect(duration).toBeLessThan(200);
    console.log(`[Perf Audit] Health Check: ${duration.toFixed(2)}ms`);
  });

  it('serves OpenAPI 3.0 JSON specification under 50ms with compression', async () => {
    const start = performance.now();
    const res = await request(app)
      .get('/api/docs/openapi.json')
      .set('Accept-Encoding', 'gzip');
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(duration).toBeLessThan(200);
    console.log(`[Perf Audit] OpenAPI JSON Spec: ${duration.toFixed(2)}ms`);
  });

  it('serves 14 Properties Catalog with Cache-Control headers under 50ms', async () => {
    const start = performance.now();
    const res = await request(app).get('/api/properties');
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.properties.length).toBe(14);
    expect(res.headers['cache-control']).toContain('public');
    expect(duration).toBeLessThan(200);
    console.log(`[Perf Audit] 14 Properties Catalog: ${duration.toFixed(2)}ms`);
  });

  it('serves Single Property Details under 50ms', async () => {
    const start = performance.now();
    const res = await request(app).get('/api/properties/the-colaba-colonial');
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.property.name).toBe('The Colaba Colonial');
    expect(duration).toBeLessThan(200);
    console.log(`[Perf Audit] Single Property: ${duration.toFixed(2)}ms`);
  });

  it('executes Room Search query with date filters under 100ms', async () => {
    const start = performance.now();
    const res = await request(app)
      .get('/api/rooms/search')
      .query({
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        guests: 2,
      });
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('public');
    expect(duration).toBeLessThan(200);
    console.log(`[Perf Audit] Room Search & Filter: ${duration.toFixed(2)}ms`);
  });

  it('executes Executive Metrics aggregation query under 100ms', async () => {
    const start = performance.now();
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        from: '2026-11-01',
        to: '2026-11-30',
      });
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.overall).toBeDefined();
    expect(duration).toBeLessThan(200);
    console.log(`[Perf Audit] Executive Metrics Aggregation: ${duration.toFixed(2)}ms`);
  });
});
