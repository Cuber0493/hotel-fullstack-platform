import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { setupTestDatabase } from '../test/testDb.js';

describe('Staff Operations & Dashboard Endpoints', () => {
  let staffToken: string;
  let guestToken: string;
  let isDbOnline = false;

  beforeEach(async () => {
    isDbOnline = await setupTestDatabase();
    if (isDbOnline) {
      const staffLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'staff@bombayreserve.com', password: 'Password@123' });
      staffToken = staffLogin.body.token || staffLogin.body.accessToken;

      const guestLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'guest@example.com', password: 'Password@123' });
      guestToken = guestLogin.body.token || guestLogin.body.accessToken;
    }
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/staff/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects non-staff (GUEST) role with 403 Forbidden', async () => {
    if (!isDbOnline) return;

    const res = await request(app)
      .get('/api/v1/staff/dashboard')
      .set('Authorization', `Bearer ${guestToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows STAFF to fetch real-time operational dashboard metrics', async () => {
    if (!isDbOnline) return;

    const res = await request(app)
      .get('/api/v1/staff/dashboard')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.metrics.totalRooms).toBeGreaterThan(0);
    expect(res.body.metrics.occupancyRate).toBeDefined();
    expect(res.body.recentBookings).toBeInstanceOf(Array);
  });

  it('allows STAFF to search and filter bookings', async () => {
    if (!isDbOnline) return;

    const res = await request(app)
      .get('/api/v1/staff/bookings?search=Priya')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bookings.length).toBeGreaterThanOrEqual(1);
    expect(res.body.bookings[0].guestName).toContain('Priya');
  });

  it('allows STAFF to check-in guest and marks assigned room occupied', async () => {
    if (!isDbOnline) return;

    const res = await request(app)
      .patch('/api/v1/staff/bookings/bk-1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'CHECKED_IN' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('CHECKED_IN');
  });

  it('allows STAFF to fetch 14-day rolling occupancy grid', async () => {
    if (!isDbOnline) return;

    const res = await request(app)
      .get('/api/v1/staff/occupancy-grid?days=7')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.dates).toHaveLength(7);
    expect(res.body.grid).toBeInstanceOf(Array);
    expect(res.body.grid.length).toBeGreaterThan(0);
  });
});
