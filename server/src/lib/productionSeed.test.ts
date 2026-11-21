import { describe, it, expect, afterEach, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma, checkDatabaseConnection } from '../lib/prisma.js';
import { seedDatabase } from '../lib/seedDatabase.js';
import { uploadService } from '../services/uploadService.js';
import { ServiceUnavailableError } from '../errors/AppError.js';

describe('Production Seeding & Security Safeguards', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const originalApiKey = process.env.CLOUDINARY_API_KEY;
  const originalApiSecret = process.env.CLOUDINARY_API_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalCloudName !== undefined) process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
    if (originalApiKey !== undefined) process.env.CLOUDINARY_API_KEY = originalApiKey;
    if (originalApiSecret !== undefined) process.env.CLOUDINARY_API_SECRET = originalApiSecret;
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    const isDbOnline = await checkDatabaseConnection();
    if (isDbOnline) {
      // Re-seed dev/test baseline so subsequent suites retain expected mock accounts
      await seedDatabase({ forceReset: true });
    }
  });

  it('proves production seeding creates no Password@123 accounts and only seeds admin and property catalog', async () => {
    const isDbOnline = await checkDatabaseConnection();
    if (!isDbOnline) {
      console.log(
        '[productionSeed.test] PostgreSQL is not reachable locally. Live database assertion runs in CI with PostgreSQL.'
      );
      return;
    }

    // Set environment to production
    process.env.NODE_ENV = 'production';

    // Run production seed with clean reset
    await seedDatabase({ forceReset: true });

    // 1. Fetch all users from PostgreSQL
    const allUsers = await prisma.user.findMany();

    // 2. Assert strictly one user exists: the environment admin
    expect(allUsers.length).toBe(1);
    expect(allUsers[0].email).toBe('admin@bombayreserve.com');
    expect(allUsers[0].role).toBe('ADMIN');

    // 3. Assert staff@bombayreserve.com was NOT created
    const staffUser = await prisma.user.findUnique({
      where: { email: 'staff@bombayreserve.com' },
    });
    expect(staffUser).toBeNull();

    // 4. Assert guest@example.com was NOT created
    const guestUser = await prisma.user.findUnique({
      where: { email: 'guest@example.com' },
    });
    expect(guestUser).toBeNull();

    // 5. Verify NO user in the database has Password@123 as their password
    for (const user of allUsers) {
      const matchesWeakPassword = await bcrypt.compare('Password@123', user.passwordHash);
      expect(matchesWeakPassword).toBe(false);
    }

    // 6. Verify property catalog is seeded (14 boutique properties)
    const propertyCount = await prisma.property.count();
    expect(propertyCount).toBe(14);

    // 7. Verify no sample bookings or enquiries were created in production
    const bookingCount = await prisma.booking.count();
    expect(bookingCount).toBe(0);

    const enquiryCount = await prisma.enquiry.count();
    expect(enquiryCount).toBe(0);
  });

  it('rejects uploadService in production with 503 Service Unavailable when Cloudinary is not configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const fakeFile: any = {
      buffer: Buffer.from('image bytes'),
      mimetype: 'image/png',
      originalname: 'facade.png',
      size: 1024,
    };

    await expect(
      uploadService.uploadPropertyImage('colaba-heritage-mansion', fakeFile)
    ).rejects.toThrow(ServiceUnavailableError);

    try {
      await uploadService.uploadPropertyImage('colaba-heritage-mansion', fakeFile);
    } catch (err: any) {
      expect(err.statusCode).toBe(503);
      expect(err.errorCode).toBe('SERVICE_UNAVAILABLE');
      expect(err.message).toContain('Cloudinary');
    }
  });

  it('allows mock image URL in development or test environment when Cloudinary is not configured', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const fakeFile: any = {
      buffer: Buffer.from('image bytes'),
      mimetype: 'image/png',
      originalname: 'facade.png',
      size: 1024,
    };

    const result = await uploadService.uploadPropertyImage('colaba-heritage-mansion', fakeFile);
    expect(result.url).toMatch(/^https:\/\/res\.cloudinary\.com\/the_bombay_reserve/);
    expect(result.publicId).toMatch(/^tbr-img-/);
  });
});
