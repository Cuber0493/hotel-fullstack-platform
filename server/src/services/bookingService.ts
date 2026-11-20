import { randomUUID } from 'crypto';
import {
  dataStore,
  BookingEntity,
} from '../repositories/dataStore.js';
import {
  CreateBookingInput,
  updateBookingStatusSchema,
} from '../schemas/hotelSchemas.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from '../errors/AppError.js';
import { logBookingEvent } from '../lib/logger.js';
import { BookingStatus, Role, RoomStatus } from '@prisma/client';

export class BookingService {
  async createBooking(input: CreateBookingInput, userId?: string | null): Promise<BookingEntity> {
    const checkIn = new Date(input.checkInDate);
    const checkOut = new Date(input.checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new ValidationError('Invalid checkInDate or checkOutDate format');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInNormalized = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const checkOutNormalized = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());

    if (checkOutNormalized <= checkInNormalized) {
      throw new ValidationError('Check-out date must be at least one day after check-in date');
    }

    const nights = Math.round(
      (checkOutNormalized.getTime() - checkInNormalized.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Find property & room type
    const property = dataStore.properties.find((p) => p.slug === input.propertySlug);
    if (!property) {
      throw new NotFoundError(`Property '${input.propertySlug}' not found`);
    }

    const roomType = property.roomTypes.find((rt) => rt.slug === input.roomTypeSlug);
    if (!roomType) {
      throw new NotFoundError(`Room type '${input.roomTypeSlug}' not found in property '${input.propertySlug}'`);
    }

    if (input.totalGuests > roomType.maxGuests) {
      throw new ValidationError(
        `Selected room capacity (${roomType.maxGuests} guests) exceeded by requested guests (${input.totalGuests})`
      );
    }

    // Check availability
    const overlappingBookings = dataStore.bookings.filter(
      (b) =>
        (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.CHECKED_IN) &&
        b.checkInDate < checkOutNormalized &&
        b.checkOutDate > checkInNormalized &&
        b.items.some((it) => it.roomTypeId === roomType.id)
    );

    if (overlappingBookings.length >= roomType.totalInventory) {
      throw new ConflictError(
        `No rooms available for ${roomType.name} between ${input.checkInDate} and ${input.checkOutDate}`
      );
    }

    // Allocate an available room number if possible
    const bookedRoomIds = new Set(
      overlappingBookings.flatMap((b) => b.items.map((i) => i.roomId)).filter(Boolean)
    );
    const candidateRoom = roomType.rooms.find((r) => !bookedRoomIds.has(r.id));

    const totalAmount = roomType.basePrice * nights;
    const bookingCode = this.generateBookingCode();
    const bookingId = `bk-${randomUUID()}`;

    const newBooking: BookingEntity = {
      id: bookingId,
      bookingCode,
      userId: userId || null,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      checkInDate: checkInNormalized,
      checkOutDate: checkOutNormalized,
      totalGuests: input.totalGuests,
      totalAmount,
      status: BookingStatus.CONFIRMED,
      specialRequests: input.specialRequests || null,
      cancellationReason: null,
      items: [
        {
          id: `bki-${randomUUID()}`,
          bookingId,
          roomTypeId: roomType.id,
          roomId: candidateRoom ? candidateRoom.id : null,
          nightPrice: roomType.basePrice,
          roomType,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.bookings.unshift(newBooking);

    logBookingEvent('created', {
      bookingId: newBooking.id,
      bookingCode: newBooking.bookingCode,
      propertySlug: property.slug,
      guestEmail: newBooking.guestEmail,
      amount: newBooking.totalAmount,
    });

    return newBooking;
  }

  async getBookingByCode(bookingCode: string): Promise<BookingEntity> {
    const booking = dataStore.bookings.find(
      (b) => b.bookingCode.toUpperCase() === bookingCode.trim().toUpperCase()
    );
    if (!booking) {
      throw new NotFoundError(`Booking reference '${bookingCode}' was not found`);
    }
    return booking;
  }

  async getUserBookings(userId: string): Promise<BookingEntity[]> {
    return dataStore.bookings.filter((b) => b.userId === userId);
  }

  async cancelBooking(
    bookingIdOrCode: string,
    reason?: string,
    requesterUserId?: string,
    requesterRole?: Role
  ): Promise<BookingEntity> {
    const booking = dataStore.bookings.find(
      (b) => b.id === bookingIdOrCode || b.bookingCode === bookingIdOrCode
    );

    if (!booking) {
      throw new NotFoundError(`Booking '${bookingIdOrCode}' not found`);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictError('This booking is already cancelled');
    }

    if (booking.status === BookingStatus.CHECKED_OUT) {
      throw new ConflictError('Cannot cancel a completed stay');
    }

    // Role check if user id provided and not staff
    if (requesterUserId && requesterRole === Role.GUEST && booking.userId && booking.userId !== requesterUserId) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason || 'Cancelled by guest request';
    booking.updatedAt = new Date();

    // Free up room if assigned
    for (const item of booking.items) {
      if (item.roomId) {
        for (const p of dataStore.properties) {
          for (const rt of p.roomTypes) {
            const r = rt.rooms.find((room) => room.id === item.roomId);
            if (r && r.status === RoomStatus.OCCUPIED) {
              r.status = RoomStatus.AVAILABLE;
            }
          }
        }
      }
    }

    logBookingEvent('cancelled', {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      guestEmail: booking.guestEmail,
      reason: booking.cancellationReason,
    });

    return booking;
  }

  async listStaffBookings(filters: {
    status?: BookingStatus;
    propertySlug?: string;
    search?: string;
    date?: string;
  }): Promise<BookingEntity[]> {
    let bookings = [...dataStore.bookings];

    if (filters.status) {
      bookings = bookings.filter((b) => b.status === filters.status);
    }

    if (filters.propertySlug) {
      const p = dataStore.properties.find((prop) => prop.slug === filters.propertySlug);
      if (p) {
        const rtIds = new Set(p.roomTypes.map((rt) => rt.id));
        bookings = bookings.filter((b) => b.items.some((it) => rtIds.has(it.roomTypeId)));
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      bookings = bookings.filter(
        (b) =>
          b.bookingCode.toLowerCase().includes(q) ||
          b.guestName.toLowerCase().includes(q) ||
          b.guestEmail.toLowerCase().includes(q) ||
          b.guestPhone.toLowerCase().includes(q)
      );
    }

    if (filters.date) {
      const targetDate = new Date(filters.date);
      if (!isNaN(targetDate.getTime())) {
        const targetNormalized = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate()
        );
        bookings = bookings.filter(
          (b) =>
            b.checkInDate.getTime() === targetNormalized.getTime() ||
            b.checkOutDate.getTime() === targetNormalized.getTime()
        );
      }
    }

    return bookings;
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    roomId?: string,
    cancellationReason?: string
  ): Promise<BookingEntity> {
    const booking = dataStore.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found`);
    }

    const previousStatus = booking.status;
    booking.status = status;
    booking.updatedAt = new Date();

    if (status === BookingStatus.CHECKED_IN) {
      // Mark room occupied
      if (roomId) {
        booking.items[0].roomId = roomId;
      }
      const assignedRoomId = booking.items[0]?.roomId;
      if (assignedRoomId) {
        this.setRoomStatus(assignedRoomId, RoomStatus.OCCUPIED);
      }
      logBookingEvent('checked_in', {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        guestEmail: booking.guestEmail,
      });
    } else if (status === BookingStatus.CHECKED_OUT) {
      const assignedRoomId = booking.items[0]?.roomId;
      if (assignedRoomId) {
        this.setRoomStatus(assignedRoomId, RoomStatus.AVAILABLE);
      }
      logBookingEvent('checked_out', {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        guestEmail: booking.guestEmail,
      });
    } else if (status === BookingStatus.CANCELLED) {
      booking.cancellationReason = cancellationReason || 'Cancelled by staff';
      const assignedRoomId = booking.items[0]?.roomId;
      if (assignedRoomId) {
        this.setRoomStatus(assignedRoomId, RoomStatus.AVAILABLE);
      }
      logBookingEvent('cancelled', {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        guestEmail: booking.guestEmail,
        reason: booking.cancellationReason,
      });
    }

    return booking;
  }

  async getStaffDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayCheckIns = dataStore.bookings.filter(
      (b) =>
        b.checkInDate.getTime() === today.getTime() &&
        (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.CHECKED_IN)
    );

    const todayCheckOuts = dataStore.bookings.filter(
      (b) =>
        b.checkOutDate.getTime() === today.getTime() &&
        (b.status === BookingStatus.CHECKED_IN || b.status === BookingStatus.CHECKED_OUT)
    );

    const currentInHouse = dataStore.bookings.filter(
      (b) => b.status === BookingStatus.CHECKED_IN
    );

    let totalRooms = 0;
    let occupiedRooms = 0;
    for (const p of dataStore.properties) {
      for (const rt of p.roomTypes) {
        totalRooms += rt.rooms.length;
        occupiedRooms += rt.rooms.filter((r) => r.status === RoomStatus.OCCUPIED).length;
      }
    }

    const pendingEnquiries = dataStore.enquiries.filter(
      (e) => e.status === 'NEW'
    ).length;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      metrics: {
        todayCheckInsCount: todayCheckIns.length,
        todayCheckOutsCount: todayCheckOuts.length,
        currentInHouseCount: currentInHouse.length,
        totalRooms,
        availableRooms: totalRooms - occupiedRooms,
        occupancyRate,
        pendingEnquiriesCount: pendingEnquiries,
      },
      todayArrivals: todayCheckIns.slice(0, 8),
      todayDepartures: todayCheckOuts.slice(0, 8),
      recentBookings: dataStore.bookings.slice(0, 10),
    };
  }

  async getOccupancyGrid(propertySlug?: string, days = 14) {
    const properties = propertySlug
      ? dataStore.properties.filter((p) => p.slug === propertySlug)
      : dataStore.properties.slice(0, 5); // Return first 5 or selected

    const now = new Date();
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const grid = properties.map((property) => {
      const roomTypesGrid = property.roomTypes.map((rt) => {
        const inventoryByDate = dates.map((dateStr) => {
          const dateObj = new Date(dateStr);
          const occupied = dataStore.bookings.filter(
            (b) =>
              (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.CHECKED_IN) &&
              b.checkInDate <= dateObj &&
              b.checkOutDate > dateObj &&
              b.items.some((it) => it.roomTypeId === rt.id)
          ).length;

          return {
            date: dateStr,
            total: rt.totalInventory,
            booked: occupied,
            available: Math.max(0, rt.totalInventory - occupied),
          };
        });

        return {
          roomTypeId: rt.id,
          roomTypeName: rt.name,
          basePrice: rt.basePrice,
          totalInventory: rt.totalInventory,
          dates: inventoryByDate,
        };
      });

      return {
        propertyId: property.id,
        propertyName: property.name,
        propertySlug: property.slug,
        roomTypes: roomTypesGrid,
      };
    });

    return { dates, grid };
  }

  private setRoomStatus(roomId: string, status: RoomStatus) {
    for (const p of dataStore.properties) {
      for (const rt of p.roomTypes) {
        const room = rt.rooms.find((r) => r.id === roomId);
        if (room) {
          room.status = status;
          return;
        }
      }
    }
  }

  private generateBookingCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'TBR-BOM-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const bookingService = new BookingService();
