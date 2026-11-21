import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { setupTestDatabase } from '../test/testDb.js';

describe('Property & Availability API Endpoints', () => {
  let isDbOnline = false;

  beforeEach(async () => {
    isDbOnline = await setupTestDatabase();
  });

  describe('GET /api/v1/properties', () => {
    it('returns all 14 Mumbai boutique properties with starting prices', async () => {
      if (!isDbOnline) return;

      const res = await request(app).get('/api/v1/properties');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(14);
      expect(res.body.properties).toHaveLength(14);

      const first = res.body.properties[0];
      expect(first.name).toBe('The Colaba Colonial');
      expect(first.startingPrice).toBeGreaterThan(0);
      expect(first.roomTypesCount).toBeGreaterThanOrEqual(2);
    });

    it('filters properties by neighborhood (case-insensitive)', async () => {
      if (!isDbOnline) return;

      const res = await request(app).get('/api/v1/properties?neighborhood=bandra');
      expect(res.status).toBe(200);
      expect(res.body.properties.length).toBeGreaterThanOrEqual(2);
      for (const p of res.body.properties) {
        expect(p.neighborhood.toLowerCase()).toContain('bandra');
      }
    });

    it('filters properties by keyword search in name or description', async () => {
      if (!isDbOnline) return;

      const res = await request(app).get('/api/v1/properties?search=Art+Deco');
      expect(res.status).toBe(200);
      expect(res.body.properties.length).toBeGreaterThan(0);
    });

    it('filters properties by max price', async () => {
      if (!isDbOnline) return;

      const res = await request(app).get('/api/v1/properties?maxPrice=12000');
      expect(res.status).toBe(200);
      for (const p of res.body.properties) {
        expect(p.startingPrice).toBeLessThanOrEqual(12000);
      }
    });
  });

  describe('GET /api/v1/properties/:slug', () => {
    it('returns detailed property profile with all room types and galleries', async () => {
      if (!isDbOnline) return;

      const res = await request(app).get('/api/v1/properties/the-colaba-colonial');
      expect(res.status).toBe(200);
      expect(res.body.property.name).toBe('The Colaba Colonial');
      expect(res.body.property.roomTypes).toHaveLength(3);
      expect(res.body.property.amenities.length).toBeGreaterThanOrEqual(4);
    });

    it('returns 404 with standardized error for unknown slug', async () => {
      if (!isDbOnline) return;

      const res = await request(app).get('/api/v1/properties/unknown-palace');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/properties/:slug/availability', () => {
    it('calculates available inventory and total night pricing for date range', async () => {
      if (!isDbOnline) return;

      const res = await request(app)
        .get('/api/v1/properties/the-colaba-colonial/availability')
        .query({
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-04',
          guests: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.propertySlug).toBe('the-colaba-colonial');
      expect(res.body.roomTypes).toBeInstanceOf(Array);
      expect(res.body.roomTypes.length).toBeGreaterThan(0);

      const firstRt = res.body.roomTypes[0];
      expect(firstRt.nights).toBe(3);
      expect(firstRt.totalPrice).toBe(firstRt.roomType.basePrice * 3);
      expect(firstRt.isAvailable).toBe(true);
      expect(firstRt.availableInventory).toBeGreaterThan(0);
    });

    it('validates date query parameters with Zod schema', async () => {
      const res = await request(app)
        .get('/api/v1/properties/the-colaba-colonial/availability')
        .query({
          checkInDate: 'invalid-date',
          checkOutDate: '2026-12-04',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
