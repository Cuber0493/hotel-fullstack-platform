import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import {
  PropertyQuery,
  CreatePropertyInput,
  UpdatePropertyInput,
  CreateRoomInput,
} from '../schemas/hotelSchemas.js';
import { NotFoundError, ConflictError } from '../errors/AppError.js';
import { logPropertyEvent } from '../lib/logger.js';
import { BookingStatus, RoomStatus } from '@prisma/client';

export interface RoomAvailabilityResult {
  roomType: any;
  totalInventory: number;
  availableInventory: number;
  isAvailable: boolean;
  totalPrice: number;
  nights: number;
}

export class PropertyService {
  async listProperties(query: PropertyQuery) {
    const properties = await prisma.property.findMany({
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });

    let filtered = properties;

    if (query.neighborhood) {
      const q = query.neighborhood.toLowerCase();
      filtered = filtered.filter((p) => p.neighborhood.toLowerCase().includes(q));
    }

    if (query.city) {
      const q = query.city.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.neighborhood.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          q === 'mumbai'
      );
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (query.amenity) {
      const a = query.amenity.toLowerCase();
      filtered = filtered.filter((p) =>
        p.amenities.some((item) => item.toLowerCase().includes(a))
      );
    }

    if (query.minPrice !== undefined) {
      filtered = filtered.filter((p) =>
        p.roomTypes.some((rt) => Number(rt.basePrice) >= (query.minPrice || 0))
      );
    }

    if (query.maxPrice !== undefined) {
      filtered = filtered.filter((p) =>
        p.roomTypes.some((rt) => Number(rt.basePrice) <= (query.maxPrice || Infinity))
      );
    }

    return filtered.map((p) => {
      const prices = p.roomTypes.map((rt) => Number(rt.basePrice));
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

  async getPropertyBySlug(slug: string) {
    return this.getPropertyByIdOrSlug(slug);
  }

  async getPropertyByIdOrSlug(idOrSlug: string) {
    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
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
      throw new NotFoundError(`Property with identifier '${idOrSlug}' not found`);
    }

    return {
      ...property,
      roomTypes: property.roomTypes.map((rt) => ({
        ...rt,
        basePrice: Number(rt.basePrice),
        baseRateInr: Number(rt.baseRateInr),
      })),
    };
  }

  async createProperty(input: CreatePropertyInput, userId?: string) {
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await prisma.property.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictError(`A property with the slug '${slug}' already exists`);
    }

    const newProperty = await prisma.property.create({
      data: {
        id: `prop-${randomUUID()}`,
        slug,
        name: input.name,
        neighborhood: input.neighborhood,
        address: input.address,
        description: input.description,
        heroImage: input.heroImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        galleryImages: input.galleryImages || [],
        amenities: input.amenities || [],
        checkInTime: '14:00',
        checkOutTime: '11:00',
        contactPhone: input.contactPhone || '+91 22 6900 1100',
        contactEmail: input.contactEmail || 'concierge@bombayreserve.com',
      },
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });

    logPropertyEvent('created', {
      propertyId: newProperty.id,
      name: newProperty.name,
      userId,
    });

    return {
      ...newProperty,
      roomTypes: newProperty.roomTypes.map((rt) => ({
        ...rt,
        basePrice: Number(rt.basePrice),
        baseRateInr: Number(rt.baseRateInr),
      })),
    };
  }

  async updateProperty(
    idOrSlug: string,
    input: UpdatePropertyInput,
    userId?: string
  ) {
    const property = await this.getPropertyByIdOrSlug(idOrSlug);

    const updated = await prisma.property.update({
      where: { id: property.id },
      data: {
        name: input.name !== undefined ? input.name : undefined,
        neighborhood: input.neighborhood !== undefined ? input.neighborhood : undefined,
        address: input.address !== undefined ? input.address : undefined,
        description: input.description !== undefined ? input.description : undefined,
        amenities: input.amenities !== undefined ? input.amenities : undefined,
        heroImage: input.heroImage !== undefined ? input.heroImage : undefined,
        galleryImages: input.galleryImages !== undefined ? input.galleryImages : undefined,
        contactPhone: input.contactPhone !== undefined ? input.contactPhone : undefined,
        contactEmail: input.contactEmail !== undefined ? input.contactEmail : undefined,
      },
      include: {
        roomTypes: {
          include: {
            rooms: true,
          },
        },
      },
    });

    logPropertyEvent('updated', {
      propertyId: updated.id,
      name: updated.name,
      userId,
    });

    return {
      ...updated,
      roomTypes: updated.roomTypes.map((rt) => ({
        ...rt,
        basePrice: Number(rt.basePrice),
        baseRateInr: Number(rt.baseRateInr),
      })),
    };
  }

  async deleteProperty(idOrSlug: string, userId?: string): Promise<{ success: boolean; id: string }> {
    const property = await this.getPropertyByIdOrSlug(idOrSlug);

    await prisma.property.delete({
      where: { id: property.id },
    });

    logPropertyEvent('deleted', {
      propertyId: property.id,
      name: property.name,
      userId,
    });

    return { success: true, id: property.id };
  }

  async getPropertyRooms(propertyIdOrSlug: string) {
    const property = await this.getPropertyByIdOrSlug(propertyIdOrSlug);
    return property.roomTypes;
  }

  async addRoom(propertyIdOrSlug: string, input: CreateRoomInput) {
    const property = await this.getPropertyByIdOrSlug(propertyIdOrSlug);
    const roomType = property.roomTypes.find(
      (rt: any) => rt.id === input.roomTypeId || rt.slug === input.roomTypeId
    );
    if (!roomType) {
      throw new NotFoundError(
        `Room type '${input.roomTypeId}' not found in property '${property.name}'`
      );
    }

    const exists = await prisma.room.findFirst({
      where: {
        propertyId: property.id,
        roomNumber: input.roomNumber,
      },
    });
    if (exists) {
      throw new ConflictError(
        `Room number '${input.roomNumber}' already exists in room type '${roomType.name}'`
      );
    }

    const newRoom = await prisma.room.create({
      data: {
        id: `room-${property.slug}-${input.roomNumber}`,
        propertyId: property.id,
        roomTypeId: roomType.id,
        roomNumber: input.roomNumber,
        floor: input.floor || '1st Floor',
        status: RoomStatus.AVAILABLE,
      },
    });

    await prisma.roomType.update({
      where: { id: roomType.id },
      data: {
        totalInventory: {
          increment: 1,
        },
      },
    });

    return newRoom;
  }

  async addImage(propertyIdOrSlug: string, imageUrl: string) {
    const property = await this.getPropertyByIdOrSlug(propertyIdOrSlug);
    const gallery = property.galleryImages || [];
    if (!gallery.includes(imageUrl)) {
      gallery.push(imageUrl);
      await prisma.property.update({
        where: { id: property.id },
        data: { galleryImages: gallery },
      });
      property.galleryImages = gallery;
    }
    return property;
  }

  async checkAvailability(
    slugOrId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guests = 1
  ): Promise<RoomAvailabilityResult[]> {
    const property = await this.getPropertyByIdOrSlug(slugOrId);

    const checkIn = new Date(Date.UTC(checkInDate.getUTCFullYear(), checkInDate.getUTCMonth(), checkInDate.getUTCDate()));
    const checkOut = new Date(Date.UTC(checkOutDate.getUTCFullYear(), checkOutDate.getUTCMonth(), checkOutDate.getUTCDate()));
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    const activeBookings = await prisma.booking.findMany({
      where: {
        status: { not: BookingStatus.CANCELLED },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
      include: {
        items: true,
      },
    });

    const results: RoomAvailabilityResult[] = [];

    for (const rt of property.roomTypes) {
      if (rt.maxGuests < guests) {
        continue;
      }

      let bookedCount = 0;
      for (const b of activeBookings) {
        for (const item of b.items) {
          if (item.roomTypeId === rt.id) {
            bookedCount += 1;
          }
        }
      }

      const totalInventory = rt.rooms?.length || rt.totalInventory || 1;
      const availableInventory = Math.max(0, totalInventory - bookedCount);
      const isAvailable = availableInventory > 0;
      const totalPrice = Number(rt.basePrice) * nights;

      results.push({
        roomType: rt,
        totalInventory,
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
