import { PrismaClient, Role, BookingStatus, RoomStatus, EnquiryStatus, EventType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { MUMBAI_PROPERTIES } from './seedData.js';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('Seeding database for The Bombay Reserve...');

  // 1. Clean existing records in reverse relation order
  await prisma.enquiry.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bombayreserve.com',
      passwordHash,
      fullName: 'Anya Mehta',
      phone: '+91 98200 11001',
      role: Role.ADMIN,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@bombayreserve.com',
      passwordHash,
      fullName: "Rohan D'Souza",
      phone: '+91 98200 11002',
      role: Role.STAFF,
    },
  });

  const guestUser = await prisma.user.create({
    data: {
      email: 'guest@example.com',
      passwordHash,
      fullName: 'Priya Sharma',
      phone: '+91 98200 11003',
      role: Role.GUEST,
    },
  });

  console.log(`Created 3 baseline users: Admin (${adminUser.email}), Staff (${staffUser.email}), Guest (${guestUser.email})`);

  // 3. Seed Properties, Room Types, and Rooms
  let totalRoomsCreated = 0;
  const createdProperties = [];

  for (const p of MUMBAI_PROPERTIES) {
    const property = await prisma.property.create({
      data: {
        slug: p.slug,
        name: p.name,
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
        roomTypes: {
          create: p.roomTypes.map((rt) => ({
            slug: rt.slug,
            name: rt.name,
            description: rt.description,
            basePrice: rt.basePrice,
            maxGuests: rt.maxGuests,
            bedCount: rt.bedCount,
            bedType: rt.bedType,
            roomSizeSqFt: rt.roomSizeSqFt,
            amenities: rt.amenities,
            images: rt.images,
            totalInventory: rt.totalInventory,
            rooms: {
              create: rt.roomNumbers.map((num, idx) => ({
                roomNumber: num,
                floor: `${num.charAt(0)}th Floor`,
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

  console.log(`Created ${createdProperties.length} Mumbai properties with ${totalRoomsCreated} total physical rooms across 42 room categories.`);

  // 4. Seed Sample Bookings
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
      bookingCode: 'TBR-BOM-882194',
      userId: guestUser.id,
      guestName: guestUser.fullName,
      guestEmail: guestUser.email,
      guestPhone: guestUser.phone || '+91 98200 11003',
      checkInDate: nextWeek,
      checkOutDate: nextWeekEnd,
      totalGuests: 2,
      totalAmount: Number(colabaSuite.basePrice) * 3,
      status: BookingStatus.CONFIRMED,
      specialRequests: 'High floor preferred, arriving late evening from Delhi.',
      items: {
        create: {
          roomTypeId: colabaSuite.id,
          roomId: colabaRoom.id,
          nightPrice: colabaSuite.basePrice,
        },
      },
    },
  });

  // Booking 2: Currently CHECKED_IN
  await prisma.booking.create({
    data: {
      bookingCode: 'TBR-BOM-773412',
      guestName: 'Vikramaditya Singhania',
      guestEmail: 'vikram.singhania@example.com',
      guestPhone: '+91 98199 44332',
      checkInDate: now,
      checkOutDate: tomorrow,
      totalGuests: 2,
      totalAmount: Number(marineSuite.basePrice),
      status: BookingStatus.CHECKED_IN,
      specialRequests: 'Celebrating 10th wedding anniversary. Chilled champagne on arrival requested.',
      items: {
        create: {
          roomTypeId: marineSuite.id,
          roomId: marineRoom.id,
          nightPrice: marineSuite.basePrice,
        },
      },
    },
  });

  // Mark room as occupied
  await prisma.room.update({
    where: { id: marineRoom.id },
    data: { status: RoomStatus.OCCUPIED },
  });

  // 5. Seed Sample Enquiries
  await prisma.enquiry.create({
    data: {
      propertyId: colaba.id,
      fullName: 'Natasha Poonawalla',
      email: 'natasha.p@example.com',
      phone: '+91 99200 88776',
      eventType: EventType.WEDDING,
      tentativeDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      estimatedGuests: 65,
      message: 'Looking to book the heritage courtyard and 10 suites for an intimate 2-day pre-wedding celebration.',
      status: EnquiryStatus.NEW,
    },
  });

  await prisma.enquiry.create({
    data: {
      propertyId: marineDrive.id,
      fullName: 'Karan Mehra',
      email: 'karan@investmumbai.com',
      phone: '+91 98700 33221',
      eventType: EventType.CORPORATE,
      tentativeDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      estimatedGuests: 25,
      message: 'Annual venture partner dinner and sunset cocktails on the private rooftop lounge.',
      status: EnquiryStatus.CONTACTED,
      internalNotes: 'Initial quote sent for ₹1,85,000 including bespoke cocktail catering.',
    },
  });

  console.log('Seed completed successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
