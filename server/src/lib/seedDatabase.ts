import { Role, BookingStatus, RoomStatus, EnquiryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { MUMBAI_PROPERTIES } from '../data/seedData.js';
import { env } from '../config/env.js';
import { prisma } from './prisma.js';

export async function seedDatabase({ forceReset = false }: { forceReset?: boolean } = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const shouldReset = forceReset || (!isProd && process.env.RESET_DB === 'true');

  console.log(`[Seed] Initiating database setup (Environment: ${process.env.NODE_ENV || 'development'})...`);

  if (shouldReset) {
    console.log('[Seed] Resetting database tables...');
    await prisma.review.deleteMany().catch(() => {});
    await prisma.bookingItem.deleteMany().catch(() => {});
    await prisma.booking.deleteMany().catch(() => {});
    await prisma.enquiry.deleteMany().catch(() => {});
    await prisma.room.deleteMany().catch(() => {});
    await prisma.roomType.deleteMany().catch(() => {});
    await prisma.property.deleteMany().catch(() => {});
    await prisma.refreshToken.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
  }

  // 1. Seed or Upsert Admin User from Environment (Strictly requiring min 12 chars in production)
  const adminEmail = (env.ADMIN_EMAIL || 'admin@bombayreserve.com').toLowerCase();
  const adminPassword = env.ADMIN_PASSWORD;
  const adminName = env.ADMIN_NAME || 'Anya Mehta';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.ADMIN,
      name: adminName,
      fullName: adminName,
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      fullName: adminName,
      phone: '+91 98200 11001',
      role: Role.ADMIN,
    },
  });

  // 2. Ensure baseline Staff and Guest accounts exist in dev/test ONLY
  let staffUser: any = null;
  let guestUser: any = null;

  if (!isProd) {
    const staffHash = await bcrypt.hash('Password@123', 10);
    staffUser = await prisma.user.upsert({
      where: { email: 'staff@bombayreserve.com' },
      update: { role: Role.ADMIN, passwordHash: staffHash },
      create: {
        email: 'staff@bombayreserve.com',
        passwordHash: staffHash,
        name: "Rohan D'Souza",
        fullName: "Rohan D'Souza",
        phone: '+91 98200 22002',
        role: Role.ADMIN,
      },
    });

    const guestHash = await bcrypt.hash('Password@123', 10);
    guestUser = await prisma.user.upsert({
      where: { email: 'guest@example.com' },
      update: { role: Role.GUEST, passwordHash: guestHash },
      create: {
        email: 'guest@example.com',
        passwordHash: guestHash,
        name: 'Priya Sharma',
        fullName: 'Priya Sharma',
        phone: '+91 98200 33003',
        role: Role.GUEST,
      },
    });

    console.log(
      `[Seed] Baseline users ready: Admin (${adminUser.email}), Staff (${staffUser.email}), Guest (${guestUser.email})`
    );
  } else {
    console.log(
      `[Seed] Production user ready: Admin (${adminUser.email}) only. Non-production demo accounts skipped.`
    );
  }

  // 3. Seed Properties, Room Types, and Rooms (Idempotent: upsert on natural keys)
  let totalRoomsCreated = 0;
  const createdProperties: any[] = [];

  for (const p of MUMBAI_PROPERTIES) {
    const property = await prisma.property.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        city: 'Mumbai',
        neighborhood: p.neighborhood,
        address: p.address,
        description: p.description,
        heroImage: p.heroImage,
        galleryImages: p.galleryImages,
        amenities: p.amenities,
        checkInTime: p.checkInTime,
        checkOutTime: p.checkOutTime,
        contactPhone: p.contactPhone,
        contactEmail: p.contactEmail,
      },
      create: {
        slug: p.slug,
        name: p.name,
        city: 'Mumbai',
        neighborhood: p.neighborhood,
        address: p.address,
        description: p.description,
        heroImage: p.heroImage,
        galleryImages: p.galleryImages,
        amenities: p.amenities,
        checkInTime: p.checkInTime,
        checkOutTime: p.checkOutTime,
        contactPhone: p.contactPhone,
        contactEmail: p.contactEmail,
      },
    });

    const propertyRoomTypes: any[] = [];

    for (const rt of p.roomTypes) {
      const roomType = await prisma.roomType.upsert({
        where: {
          propertyId_canonicalName: {
            propertyId: property.id,
            canonicalName: rt.name,
          },
        },
        update: {
          slug: rt.slug,
          name: rt.name,
          description: rt.description,
          capacity: rt.maxGuests,
          maxGuests: rt.maxGuests,
          baseRateInr: rt.basePrice,
          basePrice: rt.basePrice,
          bedCount: rt.bedCount,
          bedType: rt.bedType,
          roomSizeSqFt: rt.roomSizeSqFt,
          amenities: rt.amenities,
          images: rt.images,
          totalInventory: rt.totalInventory,
        },
        create: {
          propertyId: property.id,
          slug: rt.slug,
          name: rt.name,
          canonicalName: rt.name,
          description: rt.description,
          capacity: rt.maxGuests,
          maxGuests: rt.maxGuests,
          baseRateInr: rt.basePrice,
          basePrice: rt.basePrice,
          bedCount: rt.bedCount,
          bedType: rt.bedType,
          roomSizeSqFt: rt.roomSizeSqFt,
          amenities: rt.amenities,
          images: rt.images,
          totalInventory: rt.totalInventory,
        },
      });

      const rooms: any[] = [];
      for (const num of rt.roomNumbers) {
        const room = await prisma.room.upsert({
          where: {
            propertyId_roomNumber: {
              propertyId: property.id,
              roomNumber: num,
            },
          },
          update: {
            roomTypeId: roomType.id,
          },
          create: {
            propertyId: property.id,
            roomTypeId: roomType.id,
            roomNumber: num,
            floor: num.length > 2 ? num[0] : '1',
            status: RoomStatus.AVAILABLE,
          },
        });
        rooms.push(room);
        totalRoomsCreated++;
      }

      propertyRoomTypes.push({ ...roomType, rooms });
    }

    createdProperties.push({ ...property, roomTypes: propertyRoomTypes });
  }

  console.log(
    `[Seed] Upserted ${createdProperties.length} Mumbai properties with ${totalRoomsCreated} total physical rooms across categories.`
  );

  // 4. Seed Initial Sample Bookings if none exist (Development & Test only)
  if (!isProd && guestUser) {
    const existingBookingsCount = await prisma.booking.count();
    if (existingBookingsCount === 0 && createdProperties.length >= 2) {
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

    // Booking 1: CONFIRMED upcoming with booking code TBR-BOM-882194
    await prisma.booking.create({
      data: {
        id: 'bk-1',
        bookingCode: 'TBR-BOM-882194',
        userId: guestUser.id,
        roomId: colabaRoom.id,
        guestName: guestUser.name,
        guestEmail: guestUser.email,
        guestPhone: guestUser.phone || '+91 98200 33003',
        checkIn: nextWeek,
        checkOut: nextWeekEnd,
        checkInDate: nextWeek,
        checkOutDate: nextWeekEnd,
        guests: 2,
        totalGuests: 2,
        totalInr: Number(colabaSuite.baseRateInr) * 3,
        totalAmount: Number(colabaSuite.baseRateInr) * 3,
        status: BookingStatus.CONFIRMED,
        originalCurrency: 'INR',
        originalAmount: Number(colabaSuite.baseRateInr) * 3,
        specialRequests: 'Heritage courtyard view requested.',
        items: {
          create: [
            {
              roomTypeId: colabaSuite.id,
              roomId: colabaRoom.id,
              nightPrice: colabaSuite.baseRateInr,
            },
          ],
        },
      },
    });

    // Booking 2: Currently CHECKED_IN
    await prisma.booking.create({
      data: {
        id: 'bk-2',
        bookingCode: 'TBR-BOM-110022',
        userId: adminUser.id,
        roomId: marineRoom.id,
        guestName: adminUser.name,
        guestEmail: adminUser.email,
        guestPhone: adminUser.phone || '+91 98200 11001',
        checkIn: now,
        checkOut: tomorrow,
        checkInDate: now,
        checkOutDate: tomorrow,
        guests: 2,
        totalGuests: 2,
        totalInr: Number(marineSuite.baseRateInr),
        totalAmount: Number(marineSuite.baseRateInr),
        status: BookingStatus.CHECKED_IN,
        originalCurrency: 'INR',
        originalAmount: Number(marineSuite.baseRateInr),
        items: {
          create: [
            {
              roomTypeId: marineSuite.id,
              roomId: marineRoom.id,
              nightPrice: marineSuite.baseRateInr,
            },
          ],
        },
      },
    });

    await prisma.room.update({
      where: { id: marineRoom.id },
      data: { status: RoomStatus.OCCUPIED },
    });

    // 5. Seed Initial Sample Enquiries
    await prisma.enquiry.create({
      data: {
        id: 'enq-1',
        propertyId: colaba.id,
        userId: guestUser.id,
        name: 'Natasha Poonawalla',
        email: 'natasha.p@example.com',
        message:
          'Looking to book the heritage courtyard and 10 suites for an intimate 2-day pre-wedding celebration.',
        status: EnquiryStatus.NEW,
        internalNotes: 'Follow up with private event brochure.',
      },
    });

    await prisma.enquiry.create({
      data: {
        id: 'enq-2',
        propertyId: marineDrive.id,
        name: 'Karan Mehra',
        email: 'karan@investmumbai.com',
        message:
          'Annual venture partner dinner and sunset cocktails on the private rooftop lounge.',
        status: EnquiryStatus.CONTACTED,
        internalNotes: 'Sent rooftop quote on Nov 15.',
      },
    });
    }
  }

  console.log('[Seed] PostgreSQL database initialization completed successfully!');
}
