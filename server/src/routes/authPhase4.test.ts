import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index.js';
import { dataStore } from '../repositories/dataStore.js';
import { seedAdminUser } from '../scripts/seedAdmin.js';
import { env } from '../config/env.js';

describe('Phase 4: Authentication & Security API Tests', () => {
  beforeEach(async () => {
    dataStore.seed();
    await seedAdminUser();
  });

  describe('1. Registration Flow & Role Isolation', () => {
    it('successfully registers guest, sets httpOnly refreshToken cookie, and returns access token', async () => {
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
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('admin@bombayreserve.com');
      expect(res.body.user.role).toBe('ADMIN');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = (cookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('rejects wrong password with 401 Unauthorized', async () => {
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

    it('rejects non-existent user with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@nowhere.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('3. Token Expiry Verification', () => {
    it('rejects requests with an expired access JWT with 401 Unauthorized', async () => {
      // Craft an expired JWT signed with the valid secret
      const expiredToken = jwt.sign(
        {
          userId: 'usr-guest-1',
          email: 'guest@example.com',
          role: 'GUEST',
        },
        env.JWT_SECRET,
        { expiresIn: '-1s' } // Expired 1 second ago
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Token has expired');
    });
  });

  describe('4. Refresh Token Rotation & Reuse Detection', () => {
    it('rotates refresh token: consumes cookie, returns new access token & new rotated cookie', async () => {
      // 1. Initial Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'guest@example.com',
          password: 'Password@123',
        });

      expect(loginRes.status).toBe(200);
      const cookies1 = loginRes.headers['set-cookie'];
      const rawCookie1 = (cookies1 as unknown as string[]).find((c) => c.startsWith('refreshToken='))!;
      const token1 = rawCookie1.split(';')[0].replace('refreshToken=', '');

      // 2. Rotate via /refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${token1}`]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();

      const cookies2 = refreshRes.headers['set-cookie'];
      const rawCookie2 = (cookies2 as unknown as string[]).find((c) => c.startsWith('refreshToken='))!;
      const token2 = rawCookie2.split(';')[0].replace('refreshToken=', '');

      // Crucial: The new token is cryptographically rotated
      expect(token2).not.toBe(token1);

      // New access token works for authenticated profile
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshRes.body.accessToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('guest@example.com');
    });

    it('detects refresh token reuse: replaying a revoked token triggers family revocation and returns 401', async () => {
      // 1. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'guest@example.com',
          password: 'Password@123',
        });

      const rawCookie1 = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refreshToken='))!;
      const token1 = rawCookie1.split(';')[0].replace('refreshToken=', '');

      // 2. Rotate token (Token 1 is now consumed and revoked)
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${token1}`]);
      expect(refreshRes.status).toBe(200);

      const rawCookie2 = (refreshRes.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refreshToken='))!;
      const token2 = rawCookie2.split(';')[0].replace('refreshToken=', '');

      // 3. Attack/Replay: Attacker attempts to reuse the already-rotated Token 1
      const replayRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${token1}`]);

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error.code).toBe('UNAUTHORIZED');

      // 4. Family Revocation check: Even the latest active Token 2 is now revoked!
      const subsequentRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${token2}`]);

      expect(subsequentRes.status).toBe(401);
      expect(subsequentRes.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('5. RBAC Gates & Access Control', () => {
    it('returns 403 Forbidden when a GUEST attempts to access an ADMIN route', async () => {
      // Login as GUEST
      const guestLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'guest@example.com',
          password: 'Password@123',
        });

      const guestToken = guestLogin.body.accessToken;

      // Attempt to access staff dashboard
      const res = await request(app)
        .get('/api/staff/dashboard')
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows ADMIN to access the protected admin route with 200 OK', async () => {
      // Login as ADMIN
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: 'Password@123',
        });

      const adminToken = adminLogin.body.accessToken;

      const res = await request(app)
        .get('/api/staff/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toBeDefined();
    });
  });

  describe('6. Logout Lifecycle & Cookie Revocation', () => {
    it('revokes refresh token and clears httpOnly cookie on logout', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'guest@example.com',
          password: 'Password@123',
        });

      const rawCookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refreshToken='))!;
      const token = rawCookie.split(';')[0].replace('refreshToken=', '');

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${token}`]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toContain('logged out');

      // Verify cookie is cleared (Expires in past or empty)
      const clearCookies = logoutRes.headers['set-cookie'];
      expect(clearCookies).toBeDefined();
      const clearedCookie = (clearCookies as unknown as string[]).find((c) => c.startsWith('refreshToken='));
      expect(clearedCookie).toBeDefined();

      // Subsequent refresh with that logged out token fails
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${token}`]);

      expect(refreshRes.status).toBe(401);
    });
  });
});
