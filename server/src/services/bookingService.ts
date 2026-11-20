import { randomUUID } from 'crypto';
import {
  dataStore,
  BookingEntity,
  RoomEntity,
  RoomTypeEntity,
} from '../repositories/dataStore.js';
import {
  CreateBookingInput,
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
    const checkInRaw = input.checkInDate || input.checkIn;
    const checkOutRaw = input.checkOutDate || input.checkOut;

    if (!checkInRaw || !checkOutRaw) {
      throw new ValidationError('Both checkIn and checkOut dates are required');
    }

    const checkIn = new Date(checkInRaw);
    const checkOut = new Date(checkOutRaw);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new ValidationError('Invalid checkIn or checkOut date format (expected YYYY-MM-DD)');
    }

    const checkInNormalized = new Date(
      Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate())
    );
    const checkOutNormalized = new Date(
      Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate())
    );

    if (checkOutNormalized.getTime() <= checkInNormalized.getTime()) {
      throw new ValidationError('Check-out date must be at least one day after check-in date');
    }

    const nights = Math.round(
      (checkOutNormalized.getTime() - checkInNormalized.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights < 1) {
      throw new ValidationError('Booking must be for at least one night');
    }

    // 1. Resolve property
    const propTarget = input.propertyId || input.propertySlug;
    const property = dataStore.properties.find(
      (p) => p.id === propTarget || p.slug === propTarget
    );
    if (!property) {
      throw new NotFoundError(`Property '${propTarget}' not found`);
    }

    // 2. Resolve room and/or room type
    let targetRoom: RoomEntity | undefined;
    let targetRoomType: RoomTypeEntity | undefined;

    // Check if specific room requested
    if (input.roomId || input.roomNumber) {
      for (const rt of property.roomTypes) {
        const found = rt.rooms.find(
          (r) => r.id === input.roomId || r.roomNumber === input.roomNumber
        );
        if (found) {
          targetRoom = found;
          targetRoomType = rt;
          break;
        }
      }
      if (!targetRoom && input.roomId) {
        throw new NotFoundError(`Room '${input.roomId}' not found in property '${property.name}'`);
      }
    }

    // If room type specified without specific room
    if (!targetRoomType) {
      const rtTarget = input.roomTypeId || input.roomTypeSlug;
      if (rtTarget) {
        targetRoomType = property.roomTypes.find(
          (rt) => rt.id === rtTarget || rt.slug === rtTarget
        );
      } else if (property.roomTypes.length > 0) {
        targetRoomType = property.roomTypes[0];
      }
      if (!targetRoomType) {
        throw new NotFoundError(
          `Room type '${rtTarget || 'default'}' not found in property '${property.name}'`
        );
      }
    }

    const requestedGuests = input.totalGuests || input.guests || 1;
    if (requestedGuests > targetRoomType.maxGuests) {
      throw new ValidationError(
        `Selected room capacity (${targetRoomType.maxGuests} guests) exceeded by requested guests (${requestedGuests})`
      );
    }

    // 3. Double Booking Overlap Detection Inside Atomic Check
    // Overlap condition: b.checkInDate < checkOutNormalized && b.checkOutDate > checkInNormalized
    if (targetRoom) {
      const isRoomBooked = dataStore.bookings.some((b) => {
        if (b.status === BookingStatus.CANCELLED) return false;
        const bIn = new Date(b.checkInDate).getTime();
        const bOut = new Date(b.checkOutDate).getTime();
        const overlaps = bIn < checkOutNormalized.getTime() && bOut > checkInNormalized.getTime();
        if (!overlaps) return false;

        return b.items.some((it) => it.roomId === targetRoom!.id);
      });

      if (isRoomBooked) {
        throw new ConflictError(
          `Room '${targetRoom.roomNumber}' is already booked for the selected dates`
        );
      }
    } else {
      // Find candidate room that has no overlapping bookings
      const candidateRooms = targetRoomType.rooms.filter((room) => {
        const isRoomBooked = dataStore.bookings.some((b) => {
          if (b.status === BookingStatus.CANCELLED) return false;
          const bIn = new Date(b.checkInDate).getTime();
          const bOut = new Date(b.checkOutDate).getTime();
          const overlaps = bIn < checkOutNormalized.getTime() && bOut > checkInNormalized.getTime();
          if (!overlaps) return false;

          return b.items.some((it) => it.roomId === room.id);
        });
        return !isRoomBooked;
      });

      if (candidateRooms.length === 0) {
        throw new ConflictError(
          `No rooms available for ${targetRoomType.name} between ${checkInRaw} and ${checkOutRaw}`
        );
      }

      targetRoom = candidateRooms[0];
    }

    // 4. Calculate total amount
    const totalAmount = targetRoomType.basePrice * nights;
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
      totalGuests: requestedGuests,
      totalAmount,
      status: BookingStatus.CONFIRMED,
      specialRequests: input.specialRequests || null,
      cancellationReason: null,
      items: [
        {
          id: `bki-${randomUUID()}`,
          bookingId,
          roomTypeId: targetRoomType.id,
          roomId: targetRoom ? targetRoom.id : null,
          nightPrice: targetRoomType.basePrice,
          roomType: targetRoomType,
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

  async getBookingById(
    bookingIdOrCode: string,
    user?: { userId: string; role: Role }
  ): Promise<BookingEntity> {
    const booking = dataStore.bookings.find(
      (b) =>
        b.id === bookingIdOrCode ||
        b.bookingCode.toUpperCase() === bookingIdOrCode.trim().toUpperCase()
    );

    if (!booking) {
      throw new NotFoundError(`Booking reference '${bookingIdOrCode}' was not found`);
    }

    // If requester is a GUEST, ensure they own the booking
    if (user && user.role === Role.GUEST && booking.userId && booking.userId !== user.userId) {
      throw new ForbiddenError('You do not have permission to access this booking');
    }

    return booking;
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

    // Permission check: if requester is GUEST, they must own the booking
    if (requesterRole === Role.GUEST && booking.userId && booking.userId !== requesterUserId) {
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

    booking.status = status;
    booking.updatedAt = new Date();

    if (status === BookingStatus.CHECKED_IN) {
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
      : dataStore.properties.slice(0, 5);

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
