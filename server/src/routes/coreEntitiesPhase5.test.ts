import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index.js';
import { dataStore } from '../repositories/dataStore.js';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';

describe('Phase 5: Core Entities, Search, and Booking Engine Tests', () => {
  let adminToken: string;
  let guestToken: string;
  let otherGuestToken: string;

  beforeEach(() => {
    dataStore.seed();

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

    otherGuestToken = jwt.sign(
      { userId: 'usr-guest-2', email: 'other.guest@example.com', role: Role.GUEST },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  // =========================================================================
  // 1. Booking Overlap Logic & Pricing Calculation
  // =========================================================================
  describe('1. Booking Overlap Logic & Pricing Calculation', () => {
    it('creates a booking and correctly calculates total amount = basePrice * nights', async () => {
      const property = dataStore.properties[0]; // The Grand Colaba Mansion
      const roomType = property.roomTypes[0]; // Heritage Suite (basePrice = 18500)
      const room = roomType.rooms[0];

      // 4 nights: 2026-10-10 to 2026-10-14
      const res = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-10',
          checkOut: '2026-10-14',
          totalGuests: 2,
          guestName: 'Ananya Birla',
          guestEmail: 'ananya.birla@example.com',
          guestPhone: '+91 98200 99887',
          specialRequests: 'Quiet room on high floor',
        });

      expect(res.status).toBe(201);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.bookingCode).toMatch(/^TBR-BOM-/);
      // 4 nights * 18500 = 74000
      expect(res.body.booking.totalAmount).toBe(roomType.basePrice * 4);
      expect(res.body.booking.status).toBe('CONFIRMED');
    });

    it('prevents double booking when requested dates overlap an existing booking for the same room (Conflict 409)', async () => {
      const property = dataStore.properties[0];
      const roomType = property.roomTypes[0];
      const room = roomType.rooms[0];

      // Initial booking: Oct 10 to Oct 14
      const initial = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-10',
          checkOut: '2026-10-14',
          totalGuests: 2,
          guestName: 'Guest One',
          guestEmail: 'guest1@example.com',
          guestPhone: '+91 98200 11111',
        });
      expect(initial.status).toBe(201);

      // 1. Partial overlap at end: Oct 12 to Oct 16
      const res1 = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-12',
          checkOut: '2026-10-16',
          totalGuests: 2,
          guestName: 'Guest Two',
          guestEmail: 'guest2@example.com',
          guestPhone: '+91 98200 22222',
        });
      expect(res1.status).toBe(409);
      expect(res1.body.error.code).toBe('CONFLICT');

      // 2. Partial overlap at start: Oct 08 to Oct 12
      const res2 = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-08',
          checkOut: '2026-10-12',
          totalGuests: 2,
          guestName: 'Guest Three',
          guestEmail: 'guest3@example.com',
          guestPhone: '+91 98200 33333',
        });
      expect(res2.status).toBe(409);
      expect(res2.body.error.code).toBe('CONFLICT');

      // 3. Completely inside: Oct 11 to Oct 13
      const res3 = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-11',
          checkOut: '2026-10-13',
          totalGuests: 2,
          guestName: 'Guest Four',
          guestEmail: 'guest4@example.com',
          guestPhone: '+91 98200 44444',
        });
      expect(res3.status).toBe(409);
      expect(res3.body.error.code).toBe('CONFLICT');

      // 4. Completely surrounding: Oct 08 to Oct 16
      const res4 = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-08',
          checkOut: '2026-10-16',
          totalGuests: 2,
          guestName: 'Guest Five',
          guestEmail: 'guest5@example.com',
          guestPhone: '+91 98200 55555',
        });
      expect(res4.status).toBe(409);
      expect(res4.body.error.code).toBe('CONFLICT');
    });

    it('allows consecutive booking on exact check-out date (e.g. check-in on checkout date is not an overlap)', async () => {
      const property = dataStore.properties[0];
      const roomType = property.roomTypes[0];
      const room = roomType.rooms[0];

      // Initial booking: Oct 10 to Oct 14
      await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-10',
          checkOut: '2026-10-14',
          totalGuests: 2,
          guestName: 'First Guest',
          guestEmail: 'first@example.com',
          guestPhone: '+91 98200 11111',
        });

      // Consecutive booking checking in on Oct 14 (check-out of previous)
      const resAfter = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-14',
          checkOut: '2026-10-18',
          totalGuests: 2,
          guestName: 'Consecutive Guest After',
          guestEmail: 'after@example.com',
          guestPhone: '+91 98200 22222',
        });
      expect(resAfter.status).toBe(201);

      // Consecutive booking checking out on Oct 10 (check-in of initial)
      const resBefore = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-10-06',
          checkOut: '2026-10-10',
          totalGuests: 2,
          guestName: 'Consecutive Guest Before',
          guestEmail: 'before@example.com',
          guestPhone: '+91 98200 33333',
        });
      expect(resBefore.status).toBe(201);
    });

    it('frees up inventory when a booking is cancelled so the dates can be re-booked', async () => {
      const property = dataStore.properties[0];
      const roomType = property.roomTypes[0];
      const room = roomType.rooms[0];

      // Create booking under guestToken
      const created = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
          totalGuests: 2,
          guestName: 'Priya Sharma',
          guestEmail: 'guest@example.com',
          guestPhone: '+91 98200 11003',
        });
      expect(created.status).toBe(201);
      const bookingId = created.body.booking.id;

      // Cancel booking
      const cancelRes = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ reason: 'Trip rescheduled' });
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.booking.status).toBe('CANCELLED');

      // Now booking the exact same dates for the room should succeed!
      const rebookRes = await request(app)
        .post('/api/bookings')
        .send({
          propertySlug: property.slug,
          roomTypeSlug: roomType.slug,
          roomId: room.id,
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
          totalGuests: 2,
          guestName: 'New Guest',
          guestEmail: 'new.guest@example.com',
          guestPhone: '+91 98200 99999',
        });
      expect(rebookRes.status).toBe(201);
    });
  });

  // =========================================================================
  // 2. Room Search & Multi-Filter Query Engine (GET /api/rooms/search)
  // =========================================================================
  describe('2. Room Search & Multi-Filter Engine', () => {
    it('returns paginated search results with default parameters', async () => {
      const res = await request(app)
        .get('/api/rooms/search')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.rooms).toBeDefined();
      expect(Array.isArray(res.body.rooms)).toBe(true);
      expect(res.body.rooms.length).toBeLessThanOrEqual(10);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBeGreaterThan(0);
      expect(res.body.pagination.totalPages).toBeGreaterThan(0);
    });

    it('filters rooms by city / neighborhood', async () => {
      const res = await request(app)
        .get('/api/rooms/search')
        .query({ city: 'Colaba' });

      expect(res.status).toBe(200);
      expect(res.body.rooms.length).toBeGreaterThan(0);
      for (const room of res.body.rooms) {
        expect(
          room.neighborhood.toLowerCase().includes('colaba') ||
          room.propertyName.toLowerCase().includes('colaba')
        ).toBe(true);
      }
    });

    it('filters rooms by price range (minPrice and maxPrice)', async () => {
      const minPrice = 12000;
      const maxPrice = 20000;
      const res = await request(app)
        .get('/api/rooms/search')
        .query({ minPrice, maxPrice });

      expect(res.status).toBe(200);
      expect(res.body.rooms.length).toBeGreaterThan(0);
      for (const room of res.body.rooms) {
        expect(room.baseRateInr).toBeGreaterThanOrEqual(minPrice);
        expect(room.baseRateInr).toBeLessThanOrEqual(maxPrice);
      }
    });

    it('filters rooms by guest capacity', async () => {
      const res = await request(app)
        .get('/api/rooms/search')
        .query({ guests: 3 });

      expect(res.status).toBe(200);
      expect(res.body.rooms.length).toBeGreaterThan(0);
      for (const room of res.body.rooms) {
        expect(room.capacity).toBeGreaterThanOrEqual(3);
      }
    });

    it('sorts rooms by price ascending and descending', async () => {
      const resAsc = await request(app)
        .get('/api/rooms/search')
        .query({ sortBy: 'price_asc', limit: 20 });
      expect(resAsc.status).toBe(200);
      const pricesAsc = resAsc.body.rooms.map((r: any) => r.baseRateInr);
      for (let i = 1; i < pricesAsc.length; i++) {
        expect(pricesAsc[i]).toBeGreaterThanOrEqual(pricesAsc[i - 1]);
      }

      const resDesc = await request(app)
        .get('/api/rooms/search')
        .query({ sortBy: 'price_desc', limit: 20 });
      expect(resDesc.status).toBe(200);
      const pricesDesc = resDesc.body.rooms.map((r: any) => r.baseRateInr);
      for (let i = 1; i < pricesDesc.length; i++) {
        expect(pricesDesc[i]).toBeLessThanOrEqual(pricesDesc[i - 1]);
      }
    });

    it('excludes fully booked room types when checkIn and checkOut dates are specified', async () => {
      // Find a room type with inventory 2
      const property = dataStore.properties[0];
      const roomType = property.roomTypes[0]; // Heritage Suite (3 rooms)
      expect(roomType.rooms.length).toBe(3);

      const checkIn = '2026-12-20';
      const checkOut = '2026-12-25';

      // Initially search should include this room type
      const searchBefore = await request(app)
        .get('/api/rooms/search')
        .query({ propertyId: property.id, checkIn, checkOut });
      expect(searchBefore.status).toBe(200);
      const hasRtBefore = searchBefore.body.rooms.some((r: any) => r.roomTypeId === roomType.id);
      expect(hasRtBefore).toBe(true);

      // Book both rooms
      for (const room of roomType.rooms) {
        const bookRes = await request(app)
          .post('/api/bookings')
          .send({
            propertyId: property.id,
            roomTypeId: roomType.id,
            roomId: room.id,
            checkIn,
            checkOut,
            totalGuests: 2,
            guestName: 'Blocker Guest',
            guestEmail: 'blocker@example.com',
            guestPhone: '+91 98200 00000',
          });
        expect(bookRes.status).toBe(201);
      }

      // Now search for those dates should EXCLUDE that room type completely
      const searchAfter = await request(app)
        .get('/api/rooms/search')
        .query({ propertyId: property.id, checkIn, checkOut });
      expect(searchAfter.status).toBe(200);
      const hasRtAfter = searchAfter.body.rooms.some((r: any) => r.roomTypeId === roomType.id);
      expect(hasRtAfter).toBe(false);
    });
  });

  // =========================================================================
  // 3. Properties & Rooms: Role-Based Permissions & CRUD
  // =========================================================================
  describe('3. Properties & Rooms: Role Rules', () => {
    it('public can list and view properties without authentication', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.status).toBe(200);
      expect(res.body.properties.length).toBeGreaterThan(0);

      const sampleSlug = res.body.properties[0].slug;
      const detailRes = await request(app).get(`/api/properties/${sampleSlug}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.property.slug).toBe(sampleSlug);

      const roomsRes = await request(app).get(`/api/properties/${sampleSlug}/rooms`);
      expect(roomsRes.status).toBe(200);
      expect(roomsRes.body.rooms.length).toBeGreaterThan(0);
    });

    it('rejects property creation by unauthenticated users (401) and guests (403)', async () => {
      const payload = {
        name: 'The Royal Malabar Hill Haven',
        neighborhood: 'Malabar Hill',
        address: '12 Ridge Road, Malabar Hill, Mumbai',
        description: 'Spectacular estate with panoramic views of the Arabian Sea.',
      };

      const unauth = await request(app).post('/api/properties').send(payload);
      expect(unauth.status).toBe(401);

      const guestRes = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(payload);
      expect(guestRes.status).toBe(403);
      expect(guestRes.body.error.code).toBe('FORBIDDEN');
    });

    it('allows ADMIN to create, update, add rooms, and delete properties', async () => {
      // 1. Create Property
      const createRes = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'The Royal Malabar Hill Haven',
          neighborhood: 'Malabar Hill',
          address: '12 Ridge Road, Malabar Hill, Mumbai',
          description: 'Spectacular estate with panoramic views of the Arabian Sea.',
          amenities: ['Private Butler', 'Infinity Pool', 'Sea View'],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.property.name).toBe('The Royal Malabar Hill Haven');
      const propertyId = createRes.body.property.id;

      // 2. Update Property
      const updateRes = await request(app)
        .patch(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated ultra-luxury estate with private Helipad.',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.property.description).toContain('private Helipad');

      // 3. Add Room to Property's existing room type
      // First create a room type inside dataStore property for this new property
      const propObj = dataStore.properties.find((p) => p.id === propertyId)!;
      propObj.roomTypes.push({
        id: `rt-${propertyId}-suite`,
        propertyId,
        slug: 'presidential-suite',
        name: 'Presidential Suite',
        description: 'Opulent suite',
        basePrice: 50000,
        maxGuests: 4,
        bedCount: 2,
        bedType: 'King',
        roomSizeSqFt: 1200,
        amenities: ['Sea View'],
        images: [],
        totalInventory: 0,
        rooms: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const addRoomRes = await request(app)
        .post(`/api/properties/${propertyId}/rooms`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyId,
          roomTypeId: `rt-${propertyId}-suite`,
          roomNumber: 'PH-01',
          floor: 'Penthouse',
        });

      expect(addRoomRes.status).toBe(201);
      expect(addRoomRes.body.room.roomNumber).toBe('PH-01');

      // 4. Delete Property
      const deleteRes = await request(app)
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });

  // =========================================================================
  // 4. Bookings: Role-Based Permissions & Isolation
  // =========================================================================
  describe('4. Bookings: Role Rules & Isolation', () => {
    it('allows guests to view their own bookings but forbids accessing other guests bookings (403)', async () => {
      // Create booking owned by usr-guest-1
      const prop = dataStore.properties[0];
      const rt = prop.roomTypes[1];
      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertySlug: prop.slug,
          roomTypeSlug: rt.slug,
          checkIn: '2026-11-15',
          checkOut: '2026-11-18',
          totalGuests: 2,
          guestName: 'Priya Sharma',
          guestEmail: 'guest@example.com',
          guestPhone: '+91 98200 11003',
        });
      expect(createRes.status).toBe(201);
      const bookingId = createRes.body.booking.id;

      // Guest 1 can fetch their own booking
      const guest1Get = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${guestToken}`);
      expect(guest1Get.status).toBe(200);
      expect(guest1Get.body.booking.id).toBe(bookingId);

      // Guest 1 can view list of their own bookings
      const myBookings = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${guestToken}`);
      expect(myBookings.status).toBe(200);
      expect(myBookings.body.bookings.some((b: any) => b.id === bookingId)).toBe(true);

      // Guest 2 (different user) attempts to view Guest 1's booking -> 403 Forbidden!
      const guest2Get = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${otherGuestToken}`);
      expect(guest2Get.status).toBe(403);
      expect(guest2Get.body.error.code).toBe('FORBIDDEN');

      // Guest 2 attempts to cancel Guest 1's booking -> 403 Forbidden!
      const guest2Cancel = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${otherGuestToken}`)
        .send({ reason: 'Malicious cancellation attempt' });
      expect(guest2Cancel.status).toBe(403);
      expect(guest2Cancel.body.error.code).toBe('FORBIDDEN');

      // Admin CAN view Guest 1's booking
      const adminGet = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminGet.status).toBe(200);
      expect(adminGet.body.booking.id).toBe(bookingId);

      // Admin CAN view all bookings list
      const adminList = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.bookings.length).toBeGreaterThan(0);

      // Guest CANNOT view all bookings list -> 403 Forbidden
      const guestListAll = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${guestToken}`);
      expect(guestListAll.status).toBe(403);
      expect(guestListAll.body.error.code).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // 5. Enquiries: Role-Based Permissions
  // =========================================================================
  describe('5. Enquiries: Role Rules', () => {
    it('anyone can submit an enquiry without authentication (public)', async () => {
      const prop = dataStore.properties[0];
      const res = await request(app)
        .post('/api/enquiries')
        .send({
          propertyId: prop.id,
          name: 'Zubin Mehta',
          email: 'zubin@classical.in',
          message: 'Interested in hosting an orchestral reception on the sea lawn.',
        });

      expect(res.status).toBe(201);
      expect(res.body.enquiry).toBeDefined();
      expect(res.body.enquiry.status).toBe('NEW');
    });

    it('rejects guests from listing or modifying enquiries (403 Forbidden)', async () => {
      const listRes = await request(app)
        .get('/api/enquiries')
        .set('Authorization', `Bearer ${guestToken}`);
      expect(listRes.status).toBe(403);
      expect(listRes.body.error.code).toBe('FORBIDDEN');

      const patchRes = await request(app)
        .patch('/api/enquiries/enq-1')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ status: 'CONTACTED' });
      expect(patchRes.status).toBe(403);
      expect(patchRes.body.error.code).toBe('FORBIDDEN');
    });

    it('allows ADMIN to list and update enquiry status', async () => {
      const listRes = await request(app)
        .get('/api/enquiries')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.enquiries.length).toBeGreaterThan(0);

      const patchRes = await request(app)
        .patch('/api/enquiries/enq-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CLOSED',
          internalNotes: 'Client confirmed event booking for 10 suites.',
        });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.enquiry.status).toBe('CLOSED');
      expect(patchRes.body.enquiry.internalNotes).toContain('Client confirmed');
    });
  });

  // =========================================================================
  // 6. Image Uploads with Multer & Cloudinary
  // =========================================================================
  describe('6. Image Uploads (POST /api/properties/:id/images)', () => {
    it('rejects image uploads from unauthenticated users (401) and guests (403)', async () => {
      const propId = dataStore.properties[0].id;
      const fakeBuffer = Buffer.from('fake image content');

      const unauth = await request(app)
        .post(`/api/properties/${propId}/images`)
        .attach('image', fakeBuffer, 'test.jpg');
      expect(unauth.status).toBe(401);

      const guestRes = await request(app)
        .post(`/api/properties/${propId}/images`)
        .set('Authorization', `Bearer ${guestToken}`)
        .attach('image', fakeBuffer, 'test.jpg');
      expect(guestRes.status).toBe(403);
      expect(guestRes.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects non-image files with 400 Validation Error', async () => {
      const propId = dataStore.properties[0].id;
      const textBuffer = Buffer.from('malicious payload or plain text');

      const res = await request(app)
        .post(`/api/properties/${propId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', textBuffer, 'test.txt');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Only JPEG, PNG, and WebP images are supported');
    });

    it('allows ADMIN to upload valid images and appends the URL to property gallery', async () => {
      const propId = dataStore.properties[0].id;
      // Valid minimal 1x1 PNG header buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const res = await request(app)
        .post(`/api/properties/${propId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', pngBuffer, { filename: 'facade.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.image).toBeDefined();
      expect(res.body.image.url).toMatch(/^https:\/\/res\.cloudinary\.com/);
      expect(res.body.property.galleryImages).toContain(res.body.image.url);
    });
  });
});
