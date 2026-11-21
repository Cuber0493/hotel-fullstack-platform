import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index.js';
import { setupTestDatabase } from '../test/testDb.js';
import { seedAdminUser } from '../scripts/seedAdmin.js';
import { env } from '../config/env.js';

describe('Phase 4: Authentication & Security API Tests', () => {
  let isDbOnline = false;

  beforeEach(async () => {
    isDbOnline = await setupTestDatabase();
    if (isDbOnline) {
      await seedAdminUser();
    }
  });

  describe('1. Registration Flow & Role Isolation', () => {
    it('successfully registers guest, sets httpOnly refreshToken cookie, and returns access token', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tarun.khanna@example.com',
          password: 'Password@123',
          name: 'Tarun Khanna',
          phone: '+91 98200 44556',
        });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('tarun.khanna@example.com');
      expect(res.body.user.name).toBe('Tarun Khanna');
      expect(res.body.user.role).toBe('GUEST');
      expect(res.body.user.passwordHash).toBeUndefined();

      // Verify httpOnly cookie is dispatched
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = (cookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('enforces that public registration can ONLY create GUEST users (overrides any ADMIN role injection)', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'attacker@badactor.in',
          password: 'Password@123',
          name: 'Fake Admin',
          role: 'ADMIN', // Deliberate injection attempt
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('GUEST'); // Must strictly remain GUEST
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'guest@example.com', // Pre-seeded guest
          password: 'Password@123',
          name: 'Duplicate Priya',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already exists');
    });
  });

  describe('2. Login Credential Validation', () => {
    it('successfully authenticates with correct credentials and delivers httpOnly cookie', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: env.ADMIN_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('admin@bombayreserve.com');
      expect(res.body.user.role).toBe('ADMIN');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = (cookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('rejects wrong password with 401 Unauthorized', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: 'WrongSecretPassword99!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('3. Refresh Token Rotation & Single-Use Invalidation', () => {
    it('rotates refresh token on renewal and delivers new accessToken and new refreshToken cookie', async () => {
      if (!isDbOnline) return;

      // 1. Initial login to acquire refresh cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: env.ADMIN_PASSWORD,
        });

      expect(loginRes.status).toBe(200);
      const cookies = loginRes.headers['set-cookie'];
      const initialCookie = (cookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));

      // 2. Call refresh endpoint with cookie
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [initialCookie!]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();

      const newCookies = refreshRes.headers['set-cookie'];
      const rotatedCookie = (newCookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));
      expect(rotatedCookie).toBeDefined();
      expect(rotatedCookie).not.toBe(initialCookie); // New token must differ
    });

    it('rejects replay of previously used/revoked refresh token', async () => {
      if (!isDbOnline) return;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: env.ADMIN_PASSWORD,
        });

      const cookies = loginRes.headers['set-cookie'];
      const initialCookie = (cookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));

      // First use: valid
      await request(app).post('/api/auth/refresh').set('Cookie', [initialCookie!]);

      // Replay attempt with now-consumed token: MUST fail
      const replayRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [initialCookie!]);

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('4. Logout & Token Invalidation', () => {
    it('clears refreshToken cookie and revokes token', async () => {
      if (!isDbOnline) return;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: env.ADMIN_PASSWORD,
        });

      const cookies = loginRes.headers['set-cookie'];
      const initialCookie = (cookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [initialCookie!]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toContain('logged out');

      // Attempting to refresh with logged-out cookie must be rejected
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [initialCookie!]);

      expect(refreshRes.status).toBe(401);
    });
  });

  describe('5. Access Token Authentication & Protected Route Access', () => {
    it('allows access to GET /api/auth/me with valid Authorization Bearer header', async () => {
      if (!isDbOnline) return;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: env.ADMIN_PASSWORD,
        });

      const token = loginRes.body.accessToken;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('admin@bombayreserve.com');
      expect(meRes.body.user.role).toBe('ADMIN');
    });

    it('rejects expired access token with 401 Unauthorized', async () => {
      const expiredToken = jwt.sign(
        { userId: 'usr-1', email: 'guest@example.com', role: 'GUEST' },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('expired');
    });

    it('rejects tampered signature with 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { userId: 'usr-1', email: 'guest@example.com', role: 'GUEST' },
        'wrong_attacker_secret_key'
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
