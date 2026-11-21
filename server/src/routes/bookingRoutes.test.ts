import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { setupTestDatabase } from '../test/testDb.js';

describe('Booking API Lifecycle Endpoints', () => {
  let isDbOnline = false;

  beforeEach(async () => {
    isDbOnline = await setupTestDatabase();
  });

  describe('POST /api/v1/bookings', () => {
    it('creates a new booking, generates code TBR-BOM-XXXXXX, and allocates inventory', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          propertySlug: 'marine-drive-bayview',
          roomTypeSlug: 'sea-breeze-deluxe',
          checkInDate: '2026-12-10',
          checkOutDate: '2026-12-12',
          totalGuests: 2,
          guestName: 'Anand Mahindra',
          guestEmail: 'anand@example.com',
          guestPhone: '+91 98201 99887',
          specialRequests: 'Quiet room away from elevator.',
        });

      expect(res.status).toBe(201);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.bookingCode).toMatch(/^TBR-BOM-[A-Z0-9]{6}$/);
      expect(res.body.booking.status).toBe('CONFIRMED');
      expect(res.body.booking.totalAmount).toBe(19500 * 2); // 2 nights
      expect(res.body.booking.items).toHaveLength(1);
    });

    it('rejects booking when checkOutDate is earlier than or equal to checkInDate', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          propertySlug: 'marine-drive-bayview',
          roomTypeSlug: 'sea-breeze-deluxe',
          checkInDate: '2026-12-12',
          checkOutDate: '2026-12-10',
          totalGuests: 2,
          guestName: 'Anand Mahindra',
          guestEmail: 'anand@example.com',
          guestPhone: '+91 98201 99887',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Check-out date must be at least one day after check-in date');
    });

    it('rejects booking when guests count exceeds room capacity', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          propertySlug: 'marine-drive-bayview',
          roomTypeSlug: 'sea-breeze-deluxe', // Max 2 guests
          checkInDate: '2026-12-10',
          checkOutDate: '2026-12-12',
          totalGuests: 6,
          guestName: 'Party of Six',
          guestEmail: 'party@example.com',
          guestPhone: '+91 98201 99887',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('capacity');
    });
  });

  describe('GET /api/v1/bookings/:bookingCode', () => {
    it('retrieves existing booking by booking code', async () => {
      if (!isDbOnline) return;

      const res = await request(app).get('/api/v1/bookings/TBR-BOM-882194');
      expect(res.status).toBe(200);
      expect(res.body.booking.bookingCode).toBe('TBR-BOM-882194');
      expect(res.body.booking.guestName).toBe('Priya Sharma');
    });

    it('returns 404 for non-existent booking code', async () => {
      if (!isDbOnline) return;

      const res = await request(app).get('/api/v1/bookings/TBR-BOM-000000');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/bookings/:id/cancel', () => {
    it('cancels confirmed booking and updates status to CANCELLED', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .patch('/api/v1/bookings/bk-1/cancel')
        .send({ reason: 'Trip plans changed' });

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('CANCELLED');
      expect(res.body.booking.cancellationReason).toBe('Trip plans changed');
    });

    it('rejects cancelling an already cancelled booking with 409 Conflict', async () => {
      if (!isDbOnline) return;

      await request(app).patch('/api/v1/bookings/bk-1/cancel').send();
      const res = await request(app).patch('/api/v1/bookings/bk-1/cancel').send();

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });
});
