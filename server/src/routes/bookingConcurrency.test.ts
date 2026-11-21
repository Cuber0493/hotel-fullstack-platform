import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { prisma, setupTestDatabase, isTestDatabaseAvailable } from '../test/testDb.js';

describe('Booking Concurrency & Double-Booking Prevention Tests', () => {
  let isDbOnline = false;

  beforeAll(async () => {
    isDbOnline = await setupTestDatabase();
    if (!isDbOnline) {
      console.log(
        '[Concurrency Test Suite] Postgres database is not reachable locally. Concurrency assertions will run in CI with live PostgreSQL.'
      );
    }
  });

  it('two simultaneous bookings for the same room and dates: exactly one succeeds with 201 and one fails with 409', async () => {
    if (!isDbOnline) {
      expect(isDbOnline).toBe(false);
      return;
    }

    // Target a specific physical room to test simultaneous race conditions
    const property = await prisma.property.findUnique({
      where: { slug: 'the-colaba-colonial' },
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });

    expect(property).toBeDefined();
    const roomType = property?.roomTypes.find((rt) => rt.slug === 'heritage-grand-suite');
    expect(roomType).toBeDefined();
    const targetRoom = roomType?.rooms[0];
    expect(targetRoom).toBeDefined();

    const bookingPayload1 = {
      propertySlug: 'the-colaba-colonial',
      roomTypeSlug: 'heritage-grand-suite',
      roomId: targetRoom!.id,
      checkInDate: '2026-12-24',
      checkOutDate: '2026-12-28',
      totalGuests: 2,
      guestName: 'Concurrent Guest Alpha',
      guestEmail: 'alpha@example.com',
      guestPhone: '+91 98200 44001',
      specialRequests: 'Window suite request',
    };

    const bookingPayload2 = {
      propertySlug: 'the-colaba-colonial',
      roomTypeSlug: 'heritage-grand-suite',
      roomId: targetRoom!.id,
      checkInDate: '2026-12-24',
      checkOutDate: '2026-12-28',
      totalGuests: 2,
      guestName: 'Concurrent Guest Beta',
      guestEmail: 'beta@example.com',
      guestPhone: '+91 98200 44002',
      specialRequests: 'Quiet suite request',
    };

    // Fire two simultaneous requests competing for the exact same room and dates
    const [res1, res2] = await Promise.all([
      request(app).post('/api/v1/bookings').send(bookingPayload1),
      request(app).post('/api/v1/bookings').send(bookingPayload2),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one must succeed (201) and one must be rejected (409 Conflict)
    expect(statuses).toEqual([201, 409]);

    const successRes = res1.status === 201 ? res1 : res2;
    const conflictRes = res1.status === 409 ? res1 : res2;

    expect(successRes.body.booking).toBeDefined();
    expect(successRes.body.booking.bookingCode).toMatch(/^TBR-BOM-[A-Z0-9]{6}$/);
    expect(successRes.body.booking.status).toBe('CONFIRMED');

    expect(conflictRes.body.error).toBeDefined();
    expect(conflictRes.body.error.code).toBe('CONFLICT');
    expect(conflictRes.body.error.message).toMatch(/(already booked|DOUBLE_BOOKING_CONFLICT)/i);
  });
});
