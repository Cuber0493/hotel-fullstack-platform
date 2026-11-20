import { Role, BookingStatus, RoomStatus, EnquiryStatus, EventType } from '@prisma/client';
export { Role, BookingStatus, RoomStatus, EnquiryStatus, EventType };
import bcrypt from 'bcryptjs';
import { MUMBAI_PROPERTIES } from '../data/seedData.js';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomEntity {
  id: string;
  roomTypeId: string;
  roomNumber: string;
  floor: string;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomTypeEntity {
  id: string;
  propertyId: string;
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  maxGuests: number;
  bedCount: number;
  bedType: string;
  roomSizeSqFt: number;
  amenities: string[];
  images: string[];
  totalInventory: number;
  rooms: RoomEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyEntity {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  address: string;
  description: string;
  heroImage: string;
  galleryImages: string[];
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  contactPhone: string;
  contactEmail: string;
  roomTypes: RoomTypeEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingEntity {
  id: string;
  bookingCode: string;
  userId?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalGuests: number;
  totalAmount: number;
  status: BookingStatus;
  specialRequests?: string | null;
  cancellationReason?: string | null;
  items: {
    id: string;
    bookingId: string;
    roomTypeId: string;
    roomId?: string | null;
    nightPrice: number;
    roomType?: RoomTypeEntity;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EnquiryEntity {
  id: string;
  propertyId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  eventType: EventType;
  tentativeDate?: Date | null;
  estimatedGuests?: number | null;
  message: string;
  status: EnquiryStatus;
  internalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Universal in-memory state store pre-seeded with the 14 Mumbai properties,
 * users, bookings, and enquiries. Can be reset or swapped with Prisma.
 */
class DataStore {
  public users: UserEntity[] = [];
  public properties: PropertyEntity[] = [];
  public bookings: BookingEntity[] = [];
  public enquiries: EnquiryEntity[] = [];
  private initialized = false;

  constructor() {
    this.seed();
  }

  public seed() {
    this.users = [];
    this.properties = [];
    this.bookings = [];
    this.enquiries = [];

    // 1. Baseline Users
    const defaultHash = bcrypt.hashSync('Password@123', 10);
    this.users.push(
      {
        id: 'usr-admin-1',
        email: 'admin@bombayreserve.com',
        passwordHash: defaultHash,
        fullName: 'Anya Mehta',
        phone: '+91 98200 11001',
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr-staff-1',
        email: 'staff@bombayreserve.com',
        passwordHash: defaultHash,
        fullName: "Rohan D'Souza",
        phone: '+91 98200 11002',
        role: Role.STAFF,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr-guest-1',
        email: 'guest@example.com',
        passwordHash: defaultHash,
        fullName: 'Priya Sharma',
        phone: '+91 98200 11003',
        role: Role.GUEST,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // 2. 14 Mumbai Properties & 42 Room Categories
    for (let i = 0; i < MUMBAI_PROPERTIES.length; i++) {
      const p = MUMBAI_PROPERTIES[i];
      const propertyId = `prop-${p.slug}`;
      const roomTypes: RoomTypeEntity[] = [];

      for (let j = 0; j < p.roomTypes.length; j++) {
        const rt = p.roomTypes[j];
        const roomTypeId = `rt-${p.slug}-${rt.slug}`;
        const rooms: RoomEntity[] = rt.roomNumbers.map((num) => ({
          id: `room-${p.slug}-${num}`,
          roomTypeId,
          roomNumber: num,
          floor: `${num.charAt(0)}th Floor`,
          status: RoomStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        roomTypes.push({
          id: roomTypeId,
          propertyId,
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
          rooms,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      this.properties.push({
        id: propertyId,
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
        roomTypes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 3. Baseline Bookings
    const colaba = this.properties[0];
    const colabaSuite = colaba.roomTypes[0];
    const colabaRoom = colabaSuite.rooms[0];

    const marineDrive = this.properties[1];
    const marineSuite = marineDrive.roomTypes[0];
    const marineRoom = marineSuite.rooms[0];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

    // Confirmed upcoming
    this.bookings.push({
      id: 'bk-1',
      bookingCode: 'TBR-BOM-882194',
      userId: 'usr-guest-1',
      guestName: 'Priya Sharma',
      guestEmail: 'guest@example.com',
      guestPhone: '+91 98200 11003',
      checkInDate: nextWeek,
      checkOutDate: nextWeekEnd,
      totalGuests: 2,
      totalAmount: colabaSuite.basePrice * 3,
      status: BookingStatus.CONFIRMED,
      specialRequests: 'High floor preferred, arriving late evening from Delhi.',
      items: [
        {
          id: 'bki-1',
          bookingId: 'bk-1',
          roomTypeId: colabaSuite.id,
          roomId: colabaRoom.id,
          nightPrice: colabaSuite.basePrice,
          roomType: colabaSuite,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Checked In today
    marineRoom.status = RoomStatus.OCCUPIED;
    this.bookings.push({
      id: 'bk-2',
      bookingCode: 'TBR-BOM-773412',
      userId: null,
      guestName: 'Vikramaditya Singhania',
      guestEmail: 'vikram.singhania@example.com',
      guestPhone: '+91 98199 44332',
      checkInDate: today,
      checkOutDate: tomorrow,
      totalGuests: 2,
      totalAmount: marineSuite.basePrice,
      status: BookingStatus.CHECKED_IN,
      specialRequests: 'Celebrating 10th wedding anniversary. Chilled champagne on arrival requested.',
      items: [
        {
          id: 'bki-2',
          bookingId: 'bk-2',
          roomTypeId: marineSuite.id,
          roomId: marineRoom.id,
          nightPrice: marineSuite.basePrice,
          roomType: marineSuite,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. Sample Enquiries
    this.enquiries.push(
      {
        id: 'enq-1',
        propertyId: colaba.id,
        fullName: 'Natasha Poonawalla',
        email: 'natasha.p@example.com',
        phone: '+91 99200 88776',
        eventType: EventType.WEDDING,
        tentativeDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
        estimatedGuests: 65,
        message: 'Looking to book the heritage courtyard and 10 suites for an intimate 2-day pre-wedding celebration.',
        status: EnquiryStatus.NEW,
        internalNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'enq-2',
        propertyId: marineDrive.id,
        fullName: 'Karan Mehra',
        email: 'karan@investmumbai.com',
        phone: '+91 98700 33221',
        eventType: EventType.CORPORATE,
        tentativeDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
        estimatedGuests: 25,
        message: 'Annual venture partner dinner and sunset cocktails on the private rooftop lounge.',
        status: EnquiryStatus.CONTACTED,
        internalNotes: 'Initial quote sent for ₹1,85,000 including bespoke cocktail catering.',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    this.initialized = true;
  }
}

export const dataStore = new DataStore();
