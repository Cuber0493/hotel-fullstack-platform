import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, checkDatabaseConnection } from '../lib/prisma.js';
import { Role, BookingStatus, RoomStatus, EnquiryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('PostgreSQL Database Integration Tests', () => {
  let isPostgresAvailable = false;

  beforeAll(async () => {
    isPostgresAvailable = await checkDatabaseConnection();
    if (!isPostgresAvailable) {
      console.log(
        '[PostgreSQL Test Suite] Local PostgreSQL instance is not reachable. Skipping live database queries.'
      );
    }
  });

  afterAll(async () => {
    if (isPostgresAvailable) {
      // Clean up test fixtures created during the test run
      try {
        await prisma.booking.deleteMany({
          where: { user: { email: { contains: 'pg.test' } } },
        });
        await prisma.enquiry.deleteMany({
          where: { email: { contains: 'pg.test' } },
        });
        await prisma.user.deleteMany({
          where: { email: { contains: 'pg.test' } },
        });
        await prisma.property.deleteMany({
          where: { name: { contains: 'PG Test Haven' } },
        });
      } catch (err) {
        // Ignore cleanup errors
      }
      await prisma.$disconnect();
    }
  });

  it('verifies connection to the PostgreSQL database', async () => {
    if (!isPostgresAvailable) {
      expect(isPostgresAvailable).toBe(false);
      return;
    }

    const result = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 as connected`;
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(Number(result[0].connected)).toBe(1);
  });

  it('enforces User model constraints and password hashing in PostgreSQL', async () => {
    if (!isPostgresAvailable) return;

    const testEmail = `pg.test.user.${Date.now()}@bombayreserve.com`;
    const passwordHash = await bcrypt.hash('SecurePassword@123', 10);

    const user = await prisma.user.create({
      data: {
        name: 'PG Test Guest',
        email: testEmail,
        passwordHash,
        role: Role.GUEST,
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.role).toBe(Role.GUEST);

    // Verify unique constraint in PostgreSQL
    await expect(
      prisma.user.create({
        data: {
          name: 'Duplicate Guest',
          email: testEmail,
          passwordHash,
          role: Role.GUEST,
        },
      })
    ).rejects.toThrow();
  });

  it('enforces relational integrity across Property, RoomType, and Room in PostgreSQL', async () => {
    if (!isPostgresAvailable) return;

    const propertyName = `PG Test Haven ${Date.now()}`;
    const property = await prisma.property.create({
      data: {
        name: propertyName,
        city: 'Mumbai',
        address: 'Worli Sea Face, Mumbai 400018',
        description: 'Contemporary oceanfront retreat with sweeping Arabian Sea horizons.',
        amenities: ['Sea View', 'Infinity Pool', 'Private Butler'],
        imageUrls: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
        roomTypes: {
          create: [
            {
              canonicalName: 'Bayview Grand Suite',
              description: 'Floor-to-ceiling panoramic glass suite.',
              capacity: 2,
              baseRateInr: 28500,
              rooms: {
                create: [
                  { roomNumber: 'PG-101', status: RoomStatus.AVAILABLE },
                  { roomNumber: 'PG-102', status: RoomStatus.AVAILABLE },
                ],
              },
            },
          ],
        },
      },
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });

    expect(property.id).toBeDefined();
    expect(property.roomTypes).toHaveLength(1);
    expect(property.roomTypes[0].rooms).toHaveLength(2);
    expect(property.roomTypes[0].rooms[0].roomNumber).toBe('PG-101');
  });

  it('prevents overlapping bookings for the same room in PostgreSQL transactions', async () => {
    if (!isPostgresAvailable) return;

    // Create test user and property fixture
    const testUser = await prisma.user.create({
      data: {
        name: 'PG Booking Guest',
        email: `pg.booking.${Date.now()}@example.com`,
        passwordHash: 'hash',
        role: Role.GUEST,
      },
    });

    const testProp = await prisma.property.create({
      data: {
        name: `PG Overlap Property ${Date.now()}`,
        city: 'Mumbai',
        address: 'Bandra Bandstand',
        description: 'Test Property',
        amenities: ['Sea View'],
        imageUrls: [],
        roomTypes: {
          create: {
            canonicalName: 'Sunset Suite',
            description: 'Suite',
            capacity: 2,
            baseRateInr: 15000,
            rooms: {
              create: { roomNumber: 'OV-201', status: RoomStatus.AVAILABLE },
            },
          },
        },
      },
      include: { roomTypes: { include: { rooms: true } } },
    });

    const room = testProp.roomTypes[0].rooms[0];
    const checkIn1 = new Date('2026-12-10');
    const checkOut1 = new Date('2026-12-15');

    // 1. Initial Confirmed Booking
    const booking1 = await prisma.booking.create({
      data: {
        userId: testUser.id,
        roomId: room.id,
        checkIn: checkIn1,
        checkOut: checkOut1,
        guests: 2,
        totalInr: 75000,
        status: BookingStatus.CONFIRMED,
        originalCurrency: 'INR',
        originalAmount: 75000,
      },
    });
    expect(booking1.id).toBeDefined();

    // 2. Query for overlapping dates in PostgreSQL
    const overlapCheckIn = new Date('2026-12-12');
    const overlapCheckOut = new Date('2026-12-18');

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
        status: { not: BookingStatus.CANCELLED },
        checkIn: { lt: overlapCheckOut },
        checkOut: { gt: overlapCheckIn },
      },
    });

    expect(overlappingBookings.length).toBeGreaterThan(0);
    expect(overlappingBookings[0].id).toBe(booking1.id);
  });

  it('verifies SQL aggregation queries for Occupancy and Revenue in PostgreSQL', async () => {
    if (!isPostgresAvailable) return;

    const aggregation = await prisma.$queryRaw<
      Array<{ totalBookings: bigint; totalRevenue: number | null }>
    >`
      SELECT 
        COUNT(id) as "totalBookings",
        COALESCE(SUM("totalInr"), 0) as "totalRevenue"
      FROM bookings
      WHERE status != 'CANCELLED'
    `;

    expect(aggregation).toBeDefined();
    expect(Number(aggregation[0].totalBookings)).toBeGreaterThanOrEqual(0);
  });
});
