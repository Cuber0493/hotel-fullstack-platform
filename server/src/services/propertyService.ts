import { dataStore, PropertyEntity, RoomTypeEntity } from '../repositories/dataStore.js';
import { PropertyQuery } from '../schemas/hotelSchemas.js';
import { NotFoundError } from '../errors/AppError.js';
import { BookingStatus } from '@prisma/client';

export interface RoomAvailabilityResult {
  roomType: RoomTypeEntity;
  totalInventory: number;
  availableInventory: number;
  isAvailable: boolean;
  totalPrice: number;
  nights: number;
}

export class PropertyService {
  async listProperties(query: PropertyQuery) {
    let properties = [...dataStore.properties];

    if (query.neighborhood) {
      const q = query.neighborhood.toLowerCase();
      properties = properties.filter((p) => p.neighborhood.toLowerCase().includes(q));
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      properties = properties.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (query.amenity) {
      const a = query.amenity.toLowerCase();
      properties = properties.filter((p) =>
        p.amenities.some((item) => item.toLowerCase().includes(a))
      );
    }

    if (query.minPrice !== undefined) {
      properties = properties.filter((p) =>
        p.roomTypes.some((rt) => rt.basePrice >= (query.minPrice || 0))
      );
    }

    if (query.maxPrice !== undefined) {
      properties = properties.filter((p) =>
        p.roomTypes.some((rt) => rt.basePrice <= (query.maxPrice || Infinity))
      );
    }

    return properties.map((p) => {
      const prices = p.roomTypes.map((rt) => rt.basePrice);
      const startingPrice = prices.length ? Math.min(...prices) : 0;
      return {
        id: p.id,
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
        roomTypesCount: p.roomTypes.length,
        startingPrice,
      };
    });
  }

  async getPropertyBySlug(slug: string): Promise<PropertyEntity> {
    const property = dataStore.properties.find((p) => p.slug === slug);
    if (!property) {
      throw new NotFoundError(`Property with slug '${slug}' not found`);
    }
    return property;
  }

  async checkAvailability(
    slug: string,
    checkInDate: Date,
    checkOutDate: Date,
    guests = 1
  ): Promise<RoomAvailabilityResult[]> {
    const property = await this.getPropertyBySlug(slug);

    const checkIn = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    const checkOut = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    // Active overlapping bookings:
    // A booking overlaps if: booking.checkInDate < checkOut && booking.checkOutDate > checkIn
    // and status is CONFIRMED or CHECKED_IN
    const activeBookings = dataStore.bookings.filter(
      (b) =>
        (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.CHECKED_IN) &&
        b.checkInDate < checkOut &&
        b.checkOutDate > checkIn
    );

    const results: RoomAvailabilityResult[] = [];

    for (const rt of property.roomTypes) {
      if (rt.maxGuests < guests) {
        continue;
      }

      // Count overlapping bookings for this room type
      let bookedCount = 0;
      for (const b of activeBookings) {
        for (const item of b.items) {
          if (item.roomTypeId === rt.id) {
            bookedCount += 1;
          }
        }
      }

      const availableInventory = Math.max(0, rt.totalInventory - bookedCount);
      const isAvailable = availableInventory > 0;
      const totalPrice = rt.basePrice * nights;

      results.push({
        roomType: rt,
        totalInventory: rt.totalInventory,
        availableInventory,
        isAvailable,
        totalPrice,
        nights,
      });
    }

    return results;
  }
}

export const propertyService = new PropertyService();
