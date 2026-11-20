import { PrismaClient, Role, BookingStatus, RoomStatus, EnquiryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { MUMBAI_PROPERTIES } from '../src/data/seedData.js';

const prisma = new PrismaClient();

export async function seedDatabase({ forceReset = false }: { forceReset?: boolean } = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const shouldReset = forceReset || (!isProd && process.env.RESET_DB === 'true');

  console.log(`[Seed] Initiating database setup (Environment: ${process.env.NODE_ENV || 'development'})...`);

  if (shouldReset) {
    console.log('[Seed] Resetting database tables...');
    await prisma.review.deleteMany().catch(() => {});
    await prisma.booking.deleteMany().catch(() => {});
    await prisma.enquiry.deleteMany().catch(() => {});
    await prisma.room.deleteMany().catch(() => {});
    await prisma.roomType.deleteMany().catch(() => {});
    await prisma.property.deleteMany().catch(() => {});
    await prisma.refreshToken.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
  }

  // 1. Seed or Upsert Admin User from Environment
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bombayreserve.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Password@123';
  const adminName = process.env.ADMIN_NAME || 'Anya Mehta';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.ADMIN,
      name: adminName,
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: Role.ADMIN,
    },
  });

  // 2. Ensure baseline Staff and Guest accounts exist in dev/test or when missing
  const staffHash = await bcrypt.hash('Password@123', 10);
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@bombayreserve.com' },
    update: { role: Role.ADMIN },
    create: {
      email: 'staff@bombayreserve.com',
      passwordHash: staffHash,
      name: "Rohan D'Souza",
      role: Role.ADMIN,
    },
  });

  const guestHash = await bcrypt.hash('Password@123', 10);
  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: { role: Role.GUEST },
    create: {
      email: 'guest@example.com',
      passwordHash: guestHash,
      name: 'Priya Sharma',
      role: Role.GUEST,
    },
  });

  console.log(
    `[Seed] Baseline users ready: Admin (${adminUser.email}), Staff (${staffUser.email}), Guest (${guestUser.email})`
  );

  // 3. Seed Properties, Room Types, and Rooms (Idempotent: only if empty)
  const existingPropertiesCount = await prisma.property.count();
  if (existingPropertiesCount > 0) {
    console.log(
      `[Seed] Database already contains ${existingPropertiesCount} properties. Preserving existing inventory and bookings.`
    );
    return;
  }

  let totalRoomsCreated = 0;
  const createdProperties: any[] = [];

  for (const p of MUMBAI_PROPERTIES) {
    const property = await prisma.property.create({
      data: {
        name: p.name,
        city: 'Mumbai',
        address: p.address,
        description: p.description,
        amenities: p.amenities,
        imageUrls: [p.heroImage, ...(p.galleryImages || [])],
        roomTypes: {
          create: p.roomTypes.map((rt) => ({
            canonicalName: rt.name,
            description: rt.description,
            capacity: rt.maxGuests,
            baseRateInr: rt.basePrice,
            rooms: {
              create: rt.roomNumbers.map((num) => ({
                roomNumber: num,
                status: RoomStatus.AVAILABLE,
              })),
            },
          })),
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

    createdProperties.push(property);
    for (const rt of property.roomTypes) {
      totalRoomsCreated += rt.rooms.length;
    }
  }

  console.log(
    `[Seed] Created ${createdProperties.length} Mumbai properties with ${totalRoomsCreated} total physical rooms across categories.`
  );

  // 4. Seed Initial Sample Bookings if created freshly
  if (createdProperties.length >= 2) {
    const colaba = createdProperties[0];
    const colabaSuite = colaba.roomTypes[0];
    const colabaRoom = colabaSuite.rooms[0];

    const marineDrive = createdProperties[1];
    const marineSuite = marineDrive.roomTypes[0];
    const marineRoom = marineSuite.rooms[0];

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    // Booking 1: CONFIRMED upcoming
    await prisma.booking.create({
      data: {
        userId: guestUser.id,
        roomId: colabaRoom.id,
        checkIn: nextWeek,
        checkOut: nextWeekEnd,
        guests: 2,
        totalInr: Number(colabaSuite.baseRateInr) * 3,
        status: BookingStatus.CONFIRMED,
        originalCurrency: 'INR',
        originalAmount: Number(colabaSuite.baseRateInr) * 3,
      },
    });

    // Booking 2: Currently CHECKED_IN
    await prisma.booking.create({
      data: {
        userId: adminUser.id,
        roomId: marineRoom.id,
        checkIn: now,
        checkOut: tomorrow,
        guests: 2,
        totalInr: Number(marineSuite.baseRateInr),
        status: BookingStatus.CHECKED_IN,
        originalCurrency: 'INR',
        originalAmount: Number(marineSuite.baseRateInr),
      },
    });

    // Mark room as occupied
    await prisma.room.update({
      where: { id: marineRoom.id },
      data: { status: RoomStatus.OCCUPIED },
    });

    // 5. Seed Initial Sample Enquiries
    await prisma.enquiry.create({
      data: {
        propertyId: colaba.id,
        userId: guestUser.id,
        name: 'Natasha Poonawalla',
        email: 'natasha.p@example.com',
        message:
          'Looking to book the heritage courtyard and 10 suites for an intimate 2-day pre-wedding celebration.',
        status: EnquiryStatus.NEW,
      },
    });

    await prisma.enquiry.create({
      data: {
        propertyId: marineDrive.id,
        name: 'Karan Mehra',
        email: 'karan@investmumbai.com',
        message:
          'Annual venture partner dinner and sunset cocktails on the private rooftop lounge.',
        status: EnquiryStatus.CONTACTED,
      },
    });
  }

  console.log('[Seed] PostgreSQL database initialization completed successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .catch((e) => {
      console.error('[Seed Error]:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
