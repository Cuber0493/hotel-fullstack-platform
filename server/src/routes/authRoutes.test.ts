import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { dataStore } from '../repositories/dataStore.js';

describe('Authentication & User Lifecycle Endpoints', () => {
  beforeEach(() => {
    dataStore.seed();
  });

  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a new guest and returns sanitized user with JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newguest@example.com',
          password: 'Password@123',
          fullName: 'Kavita Kapoor',
          phone: '+91 98330 55443',
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('newguest@example.com');
      expect(res.body.user.fullName).toBe('Kavita Kapoor');
      expect(res.body.user.role).toBe('GUEST');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('rejects registration with invalid email or short password according to Zod rules', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
          fullName: 'K',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeInstanceOf(Array);
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects registration if email already exists with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'guest@example.com',
          password: 'Password@123',
          fullName: 'Duplicate Priya',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('successfully authenticates existing user and returns JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'staff@bombayreserve.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('staff@bombayreserve.com');
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('rejects incorrect password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'staff@bombayreserve.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('rejects non-existent user with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nobody@nowhere.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns current user profile when valid Bearer token provided', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@bombayreserve.com',
          password: 'Password@123',
        });

      const token = loginRes.body.token;

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('admin@bombayreserve.com');
      expect(meRes.body.user.role).toBe('ADMIN');
    });

    it('returns 401 Unauthorized when Bearer token is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Missing or malformed Authorization header');
    });

    it('returns 401 Unauthorized when Bearer token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
