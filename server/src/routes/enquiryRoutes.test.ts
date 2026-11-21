import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { setupTestDatabase, prisma } from '../test/testDb.js';

describe('Enquiry Submission & Staff Triage Endpoints', () => {
  let staffToken: string;
  let isDbOnline = false;
  let samplePropertyId = 'the-colaba-colonial';

  beforeEach(async () => {
    isDbOnline = await setupTestDatabase();
    if (isDbOnline) {
      const prop = await prisma.property.findFirst();
      if (prop) {
        samplePropertyId = prop.id;
      }

      const staffLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'staff@bombayreserve.com', password: 'Password@123' });
      staffToken = staffLogin.body.token || staffLogin.body.accessToken;
    }
  });

  it('allows public user to submit bespoke event enquiry with Zod validation', async () => {
    if (!isDbOnline) return;

    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({
        propertyId: samplePropertyId,
        name: 'Rohit Bal',
        email: 'rohit@fashion.in',
        message: 'Editorial fashion campaign shoot across the heritage colonnade and courtyard.',
      });

    expect(res.status).toBe(201);
    expect(res.body.enquiry.id).toBeDefined();
    expect(res.body.enquiry.status).toBe('NEW');
    expect(res.body.enquiry.name).toBe('Rohit Bal');
  });

  it('rejects invalid enquiry with missing phone or short message', async () => {
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({
        propertyId: samplePropertyId,
        name: 'R',
        email: 'invalid-email',
        message: 'Hi',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(1);
  });

  it('allows staff to list enquiries and update status with notes', async () => {
    if (!isDbOnline) return;

    const listRes = await request(app)
      .get('/api/v1/staff/enquiries?status=NEW')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.enquiries.length).toBeGreaterThanOrEqual(1);

    const enquiryId = listRes.body.enquiries[0].id;

    const updateRes = await request(app)
      .patch(`/api/v1/staff/enquiries/${enquiryId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'CONTACTED',
        internalNotes: 'Contacted client via WhatsApp and provided event lookbook.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.enquiry.status).toBe('CONTACTED');
    expect(updateRes.body.enquiry.internalNotes).toContain('lookbook');
  });
});
