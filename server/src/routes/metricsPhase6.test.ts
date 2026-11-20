import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index.js';
import { metricsService } from '../services/metricsService.js';
import { env } from '../config/env.js';
import { Role, BookingStatus, RoomStatus } from '@prisma/client';

describe('Phase 6: Dashboard API & Hotel Revenue Metrics Tests', () => {
  let adminToken: string;
  let guestToken: string;

  beforeEach(() => {
    adminToken = jwt.sign(
      { userId: 'usr-admin-1', email: 'admin@bombayreserve.com', role: Role.ADMIN },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    guestToken = jwt.sign(
      { userId: 'usr-guest-1', email: 'guest@example.com', role: Role.GUEST },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  // =========================================================================
  // 1. Hand-Calculated Dataset Unit Tests: SQL Aggregation & Mathematical Proof
  // =========================================================================
  describe('1. Hand-Calculated Dataset: SQL Aggregation Engine', () => {
    const testProperties = [
      { id: 'prop-alpha', name: 'Alpha Haveli', slug: 'alpha-haveli' },
      { id: 'prop-beta', name: 'Beta Villa', slug: 'beta-villa' },
    ];

    const testRooms = [
      // Alpha has 2 rooms
      { id: 'room-a1', propertyId: 'prop-alpha', roomNumber: 'A1', status: RoomStatus.AVAILABLE },
      { id: 'room-a2', propertyId: 'prop-alpha', roomNumber: 'A2', status: RoomStatus.AVAILABLE },
      // Beta has 3 rooms
      { id: 'room-b1', propertyId: 'prop-beta', roomNumber: 'B1', status: RoomStatus.AVAILABLE },
      { id: 'room-b2', propertyId: 'prop-beta', roomNumber: 'B2', status: RoomStatus.AVAILABLE },
      { id: 'room-b3', propertyId: 'prop-beta', roomNumber: 'B3', status: RoomStatus.AVAILABLE },
    ];

    const testBookings = [
      // 1. Booking 1: Enclosed in range [2026-10-10, 2026-10-15)
      // Oct 11 to Oct 14 => 3 nights @ 10,000/night = 30,000
      {
        id: 'bk-1',
        roomId: 'room-a1',
        checkIn: '2026-10-11',
        checkOut: '2026-10-14',
        status: BookingStatus.CONFIRMED,
        totalInr: 30000,
      },
      // 2. Booking 2: Left boundary span
      // Oct 07 to Oct 12 (5 nights total @ 12,000/night = 60,000)
      // Overlap in [10, 15): Oct 10, 11 => 2 nights = 24,000
      {
        id: 'bk-2',
        roomId: 'room-a2',
        checkIn: '2026-10-07',
        checkOut: '2026-10-12',
        status: BookingStatus.CONFIRMED,
        totalInr: 60000,
      },
      // 3. Booking 3: Right boundary span
      // Oct 13 to Oct 18 (5 nights total @ 15,000/night = 75,000)
      // Overlap in [10, 15): Oct 13, 14 => 2 nights = 30,000
      {
        id: 'bk-3',
        roomId: 'room-b1',
        checkIn: '2026-10-13',
        checkOut: '2026-10-18',
        status: BookingStatus.CONFIRMED,
        totalInr: 75000,
      },
      // 4. Booking 4: Encompassing entire range
      // Oct 05 to Oct 20 (15 nights total @ 20,000/night = 300,000)
      // Overlap in [10, 15): all 5 nights (Oct 10, 11, 12, 13, 14) => 5 * 20,000 = 100,000
      {
        id: 'bk-4',
        roomId: 'room-b2',
        checkIn: '2026-10-05',
        checkOut: '2026-10-20',
        status: BookingStatus.CONFIRMED,
        totalInr: 300000,
      },
      // 5. Booking 5: Cancelled booking (must be excluded completely)
      {
        id: 'bk-5',
        roomId: 'room-b3',
        checkIn: '2026-10-10',
        checkOut: '2026-10-15',
        status: BookingStatus.CANCELLED,
        totalInr: 50000,
      },
      // 6. Booking 6: Completely outside range (Oct 01 to Oct 06)
      {
        id: 'bk-6',
        roomId: 'room-b3',
        checkIn: '2026-10-01',
        checkOut: '2026-10-06',
        status: BookingStatus.CONFIRMED,
        totalInr: 50000,
      },
    ];

    beforeEach(() => {
      // Load custom test dataset into the SQL engine
      metricsService.syncFromCustomData(testProperties, testRooms, testBookings);
    });

    it('correctly aggregates Property 1 (Alpha Haveli) metrics and excludes outside/cancelled stays', () => {
      const result = metricsService.getMetrics(
        { from: '2026-10-10', to: '2026-10-15', propertyId: 'prop-alpha' },
        true // Skip auto-sync from dataStore
      );

      expect(result.days).toBe(5);
      expect(result.properties).toHaveLength(1);
      const alpha = result.properties[0];

      expect(alpha.totalRooms).toBe(2);
      expect(alpha.roomNightsAvailable).toBe(10); // 2 rooms * 5 days
      expect(alpha.roomNightsSold).toBe(5); // 3 (bk-1) + 2 (bk-2)
      expect(alpha.roomRevenueInr).toBe(54000); // 30,000 + 24,000
      expect(alpha.occupancyRate).toBe(0.5); // 5 / 10 = 50%
      expect(alpha.adr).toBe(10800); // 54,000 / 5
      expect(alpha.revpar).toBe(5400); // 54,000 / 10

      // Mathematical proof assertion: RevPAR = Occupancy * ADR
      const calculatedRevpar = Math.round(alpha.occupancyRate * alpha.adr * 100) / 100;
      expect(alpha.revpar).toBe(calculatedRevpar);
    });

    it('correctly aggregates Property 2 (Beta Villa) and strictly ignores cancelled bookings', () => {
      const result = metricsService.getMetrics(
        { from: '2026-10-10', to: '2026-10-15', propertyId: 'prop-beta' },
        true
      );

      const beta = result.properties[0];
      expect(beta.totalRooms).toBe(3);
      expect(beta.roomNightsAvailable).toBe(15); // 3 rooms * 5 days
      expect(beta.roomNightsSold).toBe(7); // 2 (bk-3) + 5 (bk-4) + 0 (bk-5 cancelled) + 0 (bk-6 outside)
      expect(beta.roomRevenueInr).toBe(130000); // 30,000 + 100,000
      expect(beta.occupancyRate).toBe(0.4667); // 7 / 15
      expect(beta.adr).toBe(18571.43); // 130,000 / 7
      expect(beta.revpar).toBe(8666.67); // 130,000 / 15

      // Mathematical proof assertion: RevPAR = Occupancy * ADR
      const exactRevpar =
        (beta.roomNightsSold / beta.roomNightsAvailable) *
        (beta.roomRevenueInr / beta.roomNightsSold);
      expect(Math.round(exactRevpar * 100) / 100).toBe(beta.revpar);

      // Check within 1.0 due to 4-decimal occupancy rounding (0.4667 vs 0.46666...)
      const calculatedRevpar = Math.round(beta.occupancyRate * beta.adr * 100) / 100;
      expect(Math.abs(beta.revpar - calculatedRevpar)).toBeLessThanOrEqual(1.0);
    });

    it('correctly computes overall platform metrics across both properties and proves RevPAR = Occupancy * ADR', () => {
      const result = metricsService.getMetrics(
        { from: '2026-10-10', to: '2026-10-15' },
        true
      );

      const overall = result.overall;
      expect(overall.totalRooms).toBe(5); // 2 + 3
      expect(overall.roomNightsAvailable).toBe(25); // 10 + 15
      expect(overall.roomNightsSold).toBe(12); // 5 + 7
      expect(overall.roomRevenueInr).toBe(184000); // 54,000 + 130,000
      expect(overall.occupancyRate).toBe(0.48); // 12 / 25
      expect(overall.adr).toBe(15333.33); // 184,000 / 12
      expect(overall.revpar).toBe(7360); // 184,000 / 25

      // Mathematical proof check: 0.48 * 15333.3333... = 7360
      const calculatedRevpar = Math.round(overall.occupancyRate * overall.adr * 100) / 100;
      expect(Math.abs(overall.revpar - calculatedRevpar)).toBeLessThanOrEqual(0.02);
    });

    it('generates exact daily trends using SQL recursive series and matches aggregate totals', () => {
      const result = metricsService.getMetrics(
        { from: '2026-10-10', to: '2026-10-15' },
        true
      );

      expect(result.dailyTrends).toHaveLength(5);
      const dates = result.dailyTrends.map((d) => d.date);
      expect(dates).toEqual([
        '2026-10-10',
        '2026-10-11',
        '2026-10-12',
        '2026-10-13',
        '2026-10-14',
      ]);

      // Sum of daily sold room nights should match overall roomNightsSold (12)
      const dailySoldSum = result.dailyTrends.reduce((sum, d) => sum + d.roomNightsSold, 0);
      expect(dailySoldSum).toBe(12);

      // Sum of daily revenue should match overall roomRevenueInr (184,000)
      const dailyRevenueSum = result.dailyTrends.reduce(
        (sum, d) => sum + d.roomRevenueInr,
        0
      );
      expect(dailyRevenueSum).toBe(184000);

      // Every day must satisfy RevPAR = Occupancy * ADR
      for (const day of result.dailyTrends) {
        if (day.roomNightsSold > 0) {
          const calcRevpar = Math.round(day.occupancyRate * day.adr * 100) / 100;
          expect(Math.abs(day.revpar - calcRevpar)).toBeLessThanOrEqual(0.05);
        }
      }
    });

    it('generates monthly trend series grouped by YYYY-MM', () => {
      const result = metricsService.getMetrics(
        { from: '2026-10-10', to: '2026-10-15' },
        true
      );

      expect(result.monthlyTrends).toHaveLength(1);
      const oct = result.monthlyTrends[0];
      expect(oct.month).toBe('2026-10');
      expect(oct.roomNightsAvailable).toBe(25);
      expect(oct.roomNightsSold).toBe(12);
      expect(oct.roomRevenueInr).toBe(184000);
      expect(oct.occupancyRate).toBe(0.48);
    });
  });

  // =========================================================================
  // 2. API Endpoint, Query Validation & Role-Based Access Control (GET /api/admin/metrics)
  // =========================================================================
  describe('2. HTTP API Security & RBAC: GET /api/admin/metrics', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/metrics');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects GUEST users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('ADMIN');
    });

    it('allows ADMIN to fetch live platform metrics with default date parameters', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.overall).toBeDefined();
      expect(res.body.overall.totalRooms).toBeGreaterThan(0);
      expect(res.body.properties.length).toBeGreaterThan(0);
      expect(res.body.dailyTrends.length).toBeGreaterThan(0);
      expect(res.body.monthlyTrends.length).toBeGreaterThan(0);
    });

    it('allows ADMIN to filter metrics by propertyId or propertySlug', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          propertyId: 'the-colaba-colonial',
          from: '2026-10-01',
          to: '2026-10-15',
        });

      expect(res.status).toBe(200);
      expect(res.body.from).toBe('2026-10-01');
      expect(res.body.to).toBe('2026-10-15');
      expect(res.body.days).toBe(14);
      expect(res.body.properties).toHaveLength(1);
      expect(res.body.properties[0].propertySlug).toBe('the-colaba-colonial');
    });

    it('rejects invalid date parameters where to date is earlier than or equal to from date (400)', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          from: '2026-10-20',
          to: '2026-10-10',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('to date must be after from date');
    });
  });
});
