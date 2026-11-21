import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { CreateBookingInput } from '../schemas/hotelSchemas.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from '../errors/AppError.js';
import { logBookingEvent } from '../lib/logger.js';
import { BookingStatus, Role, RoomStatus, Prisma } from '@prisma/client';

export class BookingService {
  async createBooking(input: CreateBookingInput, userId?: string | null) {
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

    const propTarget = input.propertyId || input.propertySlug;
    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id: propTarget }, { slug: propTarget }],
      },
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundError(`Property '${propTarget}' not found`);
    }

    let targetRoom: any | undefined;
    let targetRoomType: any | undefined;

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
    const maxCapacity = targetRoomType.maxGuests || targetRoomType.capacity;
    if (requestedGuests > maxCapacity) {
      throw new ValidationError(
        `Selected room capacity (${maxCapacity} guests) exceeded by requested guests (${requestedGuests})`
      );
    }

    const basePriceNum = Number(targetRoomType.basePrice || targetRoomType.baseRateInr);
    const totalAmount = basePriceNum * nights;
    const bookingCode = this.generateBookingCode();
    const bookingId = `bk-${randomUUID()}`;

    try {
      // Execute overlap validation and record creation in a single Serializable transaction
      const newBooking = await prisma.$transaction(
        async (tx) => {
          let allocatedRoomId = targetRoom?.id;

          if (targetRoom) {
            const overlapping = await tx.booking.findFirst({
              where: {
                roomId: targetRoom.id,
                status: { not: BookingStatus.CANCELLED },
                checkInDate: { lt: checkOutNormalized },
                checkOutDate: { gt: checkInNormalized },
              },
            });

            if (overlapping) {
              throw new ConflictError(
                `Room '${targetRoom.roomNumber}' is already booked for the selected dates`
              );
            }
          } else {
            // Find rooms for this roomType that do not have overlapping bookings
            const activeBookings = await tx.booking.findMany({
              where: {
                status: { not: BookingStatus.CANCELLED },
                checkInDate: { lt: checkOutNormalized },
                checkOutDate: { gt: checkInNormalized },
                room: {
                  roomTypeId: targetRoomType.id,
                },
              },
              select: { roomId: true },
            });

            const bookedRoomIds = new Set(activeBookings.map((b) => b.roomId).filter(Boolean));
            const availableRooms = targetRoomType.rooms.filter(
              (r: any) => !bookedRoomIds.has(r.id)
            );

            if (availableRooms.length === 0) {
              throw new ConflictError(
                `No rooms available for ${targetRoomType.name} between ${checkInRaw} and ${checkOutRaw}`
              );
            }

            allocatedRoomId = availableRooms[0].id;
          }

          const created = await tx.booking.create({
            data: {
              id: bookingId,
              bookingCode,
              userId: userId || null,
              roomId: allocatedRoomId,
              guestName: input.guestName,
              guestEmail: input.guestEmail,
              guestPhone: input.guestPhone,
              checkIn: checkInNormalized,
              checkOut: checkOutNormalized,
              checkInDate: checkInNormalized,
              checkOutDate: checkOutNormalized,
              totalGuests: requestedGuests,
              totalAmount,
              totalInr: totalAmount,
              originalAmount: totalAmount,
              originalCurrency: 'INR',
              status: BookingStatus.CONFIRMED,
              specialRequests: input.specialRequests || null,
              items: {
                create: [
                  {
                    roomTypeId: targetRoomType.id,
                    roomId: allocatedRoomId,
                    nightPrice: basePriceNum,
                  },
                ],
              },
            },
            include: {
              items: {
                include: {
                  roomType: true,
                },
              },
            },
          });

          return created;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      logBookingEvent('created', {
        bookingId: newBooking.id,
        bookingCode: newBooking.bookingCode,
        propertySlug: property.slug,
        guestEmail: newBooking.guestEmail,
        amount: Number(newBooking.totalAmount),
      });

      return this.formatBooking(newBooking);
    } catch (err: any) {
      if (err?.code === 'P2034' || err?.message?.includes('could not serialize access')) {
        throw new ConflictError(
          'DOUBLE_BOOKING_CONFLICT: The selected room was booked concurrently by another guest'
        );
      }
      throw err;
    }
  }

  async getBookingById(
    bookingIdOrCode: string,
    user?: { userId: string; role: Role }
  ) {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id: bookingIdOrCode },
          { bookingCode: bookingIdOrCode.trim().toUpperCase() },
        ],
      },
      include: {
        items: {
          include: {
            roomType: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking reference '${bookingIdOrCode}' was not found`);
    }

    if (user && user.role === Role.GUEST && booking.userId && booking.userId !== user.userId) {
      throw new ForbiddenError('You do not have permission to access this booking');
    }

    return this.formatBooking(booking);
  }

  async getBookingByCode(bookingCode: string) {
    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode: bookingCode.trim().toUpperCase(),
      },
      include: {
        items: {
          include: {
            roomType: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking reference '${bookingCode}' was not found`);
    }

    return this.formatBooking(booking);
  }

  async getUserBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            roomType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => this.formatBooking(b));
  }

  async cancelBooking(
    bookingIdOrCode: string,
    reason?: string,
    requesterUserId?: string,
    requesterRole?: Role
  ) {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id: bookingIdOrCode },
          { bookingCode: bookingIdOrCode.trim().toUpperCase() },
        ],
      },
      include: {
        items: true,
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking '${bookingIdOrCode}' not found`);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictError('This booking is already cancelled');
    }

    if (booking.status === BookingStatus.CHECKED_OUT) {
      throw new ConflictError('Cannot cancel a completed stay');
    }

    if (requesterRole === Role.GUEST && booking.userId && booking.userId !== requesterUserId) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason || 'Cancelled by guest request',
      },
      include: {
        items: {
          include: {
            roomType: true,
          },
        },
      },
    });

    if (booking.roomId) {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: RoomStatus.AVAILABLE },
      }).catch(() => {});
    }

    logBookingEvent('cancelled', {
      bookingId: updated.id,
      bookingCode: updated.bookingCode,
      guestEmail: updated.guestEmail,
      reason: updated.cancellationReason || undefined,
    });

    return this.formatBooking(updated);
  }

  async listStaffBookings(filters: {
    status?: BookingStatus;
    propertySlug?: string;
    search?: string;
    date?: string;
  }) {
    const where: Prisma.BookingWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.propertySlug) {
      where.room = {
        property: {
          slug: filters.propertySlug,
        },
      };
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { bookingCode: { contains: q, mode: 'insensitive' } },
        { guestName: { contains: q, mode: 'insensitive' } },
        { guestEmail: { contains: q, mode: 'insensitive' } },
        { guestPhone: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filters.date) {
      const targetDate = new Date(filters.date);
      if (!isNaN(targetDate.getTime())) {
        const start = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
        where.OR = [
          { checkInDate: start },
          { checkOutDate: start },
        ];
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        items: {
          include: {
            roomType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => this.formatBooking(b));
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    roomId?: string,
    cancellationReason?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true },
    });

    if (!booking) {
      throw new NotFoundError(`Booking '${bookingId}' not found`);
    }

    const assignedRoomId = roomId || booking.roomId || booking.items[0]?.roomId;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        roomId: assignedRoomId || undefined,
        cancellationReason:
          status === BookingStatus.CANCELLED
            ? cancellationReason || 'Cancelled by staff'
            : booking.cancellationReason,
      },
      include: {
        items: {
          include: {
            roomType: true,
          },
        },
      },
    });

    if (assignedRoomId) {
      if (status === BookingStatus.CHECKED_IN) {
        await prisma.room.update({
          where: { id: assignedRoomId },
          data: { status: RoomStatus.OCCUPIED },
        }).catch(() => {});
      } else if (status === BookingStatus.CHECKED_OUT || status === BookingStatus.CANCELLED) {
        await prisma.room.update({
          where: { id: assignedRoomId },
          data: { status: RoomStatus.AVAILABLE },
        }).catch(() => {});
      }
    }

    return this.formatBooking(updated);
  }

  async getStaffDashboard() {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [todayCheckIns, todayCheckOuts, currentInHouse, totalRooms, occupiedRooms, pendingEnquiries] =
      await Promise.all([
        prisma.booking.findMany({
          where: {
            checkInDate: today,
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          },
          include: { items: { include: { roomType: true } } },
        }),
        prisma.booking.findMany({
          where: {
            checkOutDate: today,
            status: { in: [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
          },
          include: { items: { include: { roomType: true } } },
        }),
        prisma.booking.findMany({
          where: {
            status: BookingStatus.CHECKED_IN,
          },
          include: { items: { include: { roomType: true } } },
        }),
        prisma.room.count(),
        prisma.room.count({ where: { status: RoomStatus.OCCUPIED } }),
        prisma.enquiry.count({ where: { status: 'NEW' } }),
      ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const recent = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { roomType: true } } },
    });

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
      todayArrivals: todayCheckIns.slice(0, 8).map((b) => this.formatBooking(b)),
      todayDepartures: todayCheckOuts.slice(0, 8).map((b) => this.formatBooking(b)),
      recentBookings: recent.map((b) => this.formatBooking(b)),
    };
  }

  async getOccupancyGrid(propertySlug?: string, days = 14) {
    const properties = await prisma.property.findMany({
      where: propertySlug ? { slug: propertySlug } : undefined,
      take: 5,
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });

    const now = new Date();
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const grid = await Promise.all(
      properties.map(async (property) => {
        const roomTypesGrid = await Promise.all(
          property.roomTypes.map(async (rt) => {
            const inventoryByDate = await Promise.all(
              dates.map(async (dateStr) => {
                const dateObj = new Date(dateStr);
                const occupied = await prisma.booking.count({
                  where: {
                    status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
                    checkInDate: { lte: dateObj },
                    checkOutDate: { gt: dateObj },
                    items: {
                      some: { roomTypeId: rt.id },
                    },
                  },
                });

                const totalInventory = rt.rooms.length || rt.totalInventory || 1;
                return {
                  date: dateStr,
                  total: totalInventory,
                  booked: occupied,
                  available: Math.max(0, totalInventory - occupied),
                };
              })
            );

            return {
              roomTypeId: rt.id,
              roomTypeName: rt.name,
              basePrice: Number(rt.basePrice),
              totalInventory: rt.rooms.length || rt.totalInventory || 1,
              dates: inventoryByDate,
            };
          })
        );

        return {
          propertyId: property.id,
          propertyName: property.name,
          propertySlug: property.slug,
          roomTypes: roomTypesGrid,
        };
      })
    );

    return { dates, grid };
  }

  private formatBooking(b: any) {
    return {
      id: b.id,
      bookingCode: b.bookingCode,
      userId: b.userId || null,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone,
      checkInDate: b.checkInDate instanceof Date ? b.checkInDate.toISOString().split('T')[0] : b.checkInDate,
      checkOutDate: b.checkOutDate instanceof Date ? b.checkOutDate.toISOString().split('T')[0] : b.checkOutDate,
      totalGuests: b.totalGuests,
      totalAmount: Number(b.totalAmount || b.totalInr || 0),
      status: b.status,
      specialRequests: b.specialRequests || null,
      cancellationReason: b.cancellationReason || null,
      items: (b.items || []).map((it: any) => ({
        id: it.id,
        bookingId: it.bookingId,
        roomTypeId: it.roomTypeId,
        roomId: it.roomId || null,
        nightPrice: Number(it.nightPrice || 0),
        roomType: it.roomType
          ? {
              ...it.roomType,
              basePrice: Number(it.roomType.basePrice || 0),
              baseRateInr: Number(it.roomType.baseRateInr || 0),
            }
          : undefined,
      })),
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
      updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : b.updatedAt,
    };
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
