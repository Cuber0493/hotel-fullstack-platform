import { prisma } from '../lib/prisma.js';
import { RoomSearchQuery } from '../schemas/hotelSchemas.js';
import { BookingStatus } from '@prisma/client';

export interface RoomSearchResultItem {
  id: string;
  roomTypeId: string;
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  neighborhood: string;
  roomTypeName: string;
  roomTypeSlug: string;
  description: string;
  baseRateInr: number;
  capacity: number;
  amenities: string[];
  images: string[];
  availableRoomsCount: number;
  availableRoomNumbers: string[];
}

export interface RoomSearchResponse {
  rooms: RoomSearchResultItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class SearchService {
  public async searchRooms(query: RoomSearchQuery): Promise<RoomSearchResponse> {
    const {
      city,
      propertyId,
      property: propertySlugParam,
      checkIn,
      checkOut,
      guests = 1,
      minPrice,
      maxPrice,
      roomType,
      amenities,
      sortBy = 'price_asc',
      page = 1,
      limit = 10,
    } = query;

    let inDate: Date | null = null;
    let outDate: Date | null = null;

    if (checkIn && checkOut) {
      inDate = new Date(checkIn);
      outDate = new Date(checkOut);
    }

    const requestedAmenities = amenities
      ? amenities.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean)
      : [];

    const properties = await prisma.property.findMany({
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });

    // If date range is specified, retrieve all active bookings in that range
    let bookedRoomIds = new Set<string>();
    if (inDate && outDate) {
      const activeBookings = await prisma.booking.findMany({
        where: {
          status: { not: BookingStatus.CANCELLED },
          checkInDate: { lt: outDate },
          checkOutDate: { gt: inDate },
        },
        select: {
          roomId: true,
          items: {
            select: { roomId: true },
          },
        },
      });

      for (const b of activeBookings) {
        if (b.roomId) bookedRoomIds.add(b.roomId);
        for (const item of b.items) {
          if (item.roomId) bookedRoomIds.add(item.roomId);
        }
      }
    }

    const results: RoomSearchResultItem[] = [];

    for (const prop of properties) {
      // 1. Property / City Filter
      if (propertyId && prop.id !== propertyId) {
        continue;
      }
      if (propertySlugParam && prop.slug !== propertySlugParam && prop.id !== propertySlugParam) {
        continue;
      }
      if (city) {
        const cityLower = city.toLowerCase();
        const matchesCity =
          prop.neighborhood.toLowerCase().includes(cityLower) ||
          prop.address.toLowerCase().includes(cityLower) ||
          prop.name.toLowerCase().includes(cityLower) ||
          cityLower === 'mumbai';
        if (!matchesCity) continue;
      }

      for (const rt of prop.roomTypes) {
        const baseRate = Number(rt.basePrice || rt.baseRateInr);
        const capacity = rt.maxGuests || rt.capacity;

        // 2. Capacity & Price Filter
        if (capacity < guests) {
          continue;
        }
        if (minPrice !== undefined && baseRate < minPrice) {
          continue;
        }
        if (maxPrice !== undefined && baseRate > maxPrice) {
          continue;
        }

        // 3. Room Type Name / Category Filter
        if (roomType) {
          const rtFilterLower = roomType.toLowerCase();
          const matchesRt =
            rt.name.toLowerCase().includes(rtFilterLower) ||
            rt.slug.toLowerCase().includes(rtFilterLower);
          if (!matchesRt) continue;
        }

        // 4. Amenities Filter
        if (requestedAmenities.length > 0) {
          const combinedAmenities = [...rt.amenities, ...prop.amenities].map((a) => a.toLowerCase());
          const hasAll = requestedAmenities.every((reqAmenity) =>
            combinedAmenities.some((a) => a.includes(reqAmenity))
          );
          if (!hasAll) continue;
        }

        // 5. Date Availability Check
        let availableRooms = rt.rooms;

        if (inDate && outDate) {
          availableRooms = rt.rooms.filter((room) => !bookedRoomIds.has(room.id));
          if (availableRooms.length === 0) {
            continue;
          }
        }

        results.push({
          id: rt.id,
          roomTypeId: rt.id,
          propertyId: prop.id,
          propertyName: prop.name,
          propertySlug: prop.slug,
          neighborhood: prop.neighborhood,
          roomTypeName: rt.name,
          roomTypeSlug: rt.slug,
          description: rt.description,
          baseRateInr: baseRate,
          capacity,
          amenities: rt.amenities,
          images: rt.images && rt.images.length > 0 ? rt.images : prop.galleryImages,
          availableRoomsCount: availableRooms.length,
          availableRoomNumbers: availableRooms.map((r) => r.roomNumber),
        });
      }
    }

    // 6. Sorting
    results.sort((a, b) => {
      if (sortBy === 'price_asc') return a.baseRateInr - b.baseRateInr;
      if (sortBy === 'price_desc') return b.baseRateInr - a.baseRateInr;
      if (sortBy === 'capacity_desc') return b.capacity - a.capacity;
      if (sortBy === 'name_asc') return a.roomTypeName.localeCompare(b.roomTypeName);
      return 0;
    });

    // 7. Pagination
    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginatedItems = results.slice(startIndex, startIndex + limit);

    return {
      rooms: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}

export const searchService = new SearchService();
