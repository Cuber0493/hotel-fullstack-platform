import { randomUUID } from 'crypto';
import {
  dataStore,
  PropertyEntity,
  RoomTypeEntity,
  RoomEntity,
  RoomStatus,
  BookingStatus,
} from '../repositories/dataStore.js';
import {
  PropertyQuery,
  CreatePropertyInput,
  UpdatePropertyInput,
  CreateRoomInput,
} from '../schemas/hotelSchemas.js';
import { NotFoundError, ConflictError } from '../errors/AppError.js';
import { logPropertyEvent } from '../lib/logger.js';

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

    if (query.city) {
      const q = query.city.toLowerCase();
      properties = properties.filter(
        (p) =>
          p.neighborhood.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          q === 'mumbai'
      );
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
    return this.getPropertyByIdOrSlug(slug);
  }

  async getPropertyByIdOrSlug(idOrSlug: string): Promise<PropertyEntity> {
    const property = dataStore.properties.find(
      (p) => p.id === idOrSlug || p.slug === idOrSlug
    );
    if (!property) {
      throw new NotFoundError(`Property with identifier '${idOrSlug}' not found`);
    }
    return property;
  }

  async createProperty(input: CreatePropertyInput, userId?: string): Promise<PropertyEntity> {
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = dataStore.properties.find((p) => p.slug === slug);
    if (existing) {
      throw new ConflictError(`A property with the slug '${slug}' already exists`);
    }

    const newProperty: PropertyEntity = {
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
      roomTypes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.properties.push(newProperty);

    logPropertyEvent('created', {
      propertyId: newProperty.id,
      name: newProperty.name,
      userId,
    });

    return newProperty;
  }

  async updateProperty(
    idOrSlug: string,
    input: UpdatePropertyInput,
    userId?: string
  ): Promise<PropertyEntity> {
    const property = await this.getPropertyByIdOrSlug(idOrSlug);

    if (input.name !== undefined) property.name = input.name;
    if (input.neighborhood !== undefined) property.neighborhood = input.neighborhood;
    if (input.address !== undefined) property.address = input.address;
    if (input.description !== undefined) property.description = input.description;
    if (input.amenities !== undefined) property.amenities = input.amenities;
    if (input.heroImage !== undefined) property.heroImage = input.heroImage;
    if (input.galleryImages !== undefined) property.galleryImages = input.galleryImages;
    if (input.contactPhone !== undefined) property.contactPhone = input.contactPhone;
    if (input.contactEmail !== undefined) property.contactEmail = input.contactEmail;
    property.updatedAt = new Date();

    logPropertyEvent('updated', {
      propertyId: property.id,
      name: property.name,
      userId,
    });

    return property;
  }

  async deleteProperty(idOrSlug: string, userId?: string): Promise<{ success: boolean; id: string }> {
    const index = dataStore.properties.findIndex(
      (p) => p.id === idOrSlug || p.slug === idOrSlug
    );
    if (index === -1) {
      throw new NotFoundError(`Property '${idOrSlug}' not found`);
    }

    const removed = dataStore.properties.splice(index, 1)[0];

    logPropertyEvent('deleted', {
      propertyId: removed.id,
      name: removed.name,
      userId,
    });

    return { success: true, id: removed.id };
  }

  async getPropertyRooms(propertyIdOrSlug: string): Promise<RoomTypeEntity[]> {
    const property = await this.getPropertyByIdOrSlug(propertyIdOrSlug);
    return property.roomTypes;
  }

  async addRoom(propertyIdOrSlug: string, input: CreateRoomInput): Promise<RoomEntity> {
    const property = await this.getPropertyByIdOrSlug(propertyIdOrSlug);
    const roomType = property.roomTypes.find(
      (rt) => rt.id === input.roomTypeId || rt.slug === input.roomTypeId
    );
    if (!roomType) {
      throw new NotFoundError(
        `Room type '${input.roomTypeId}' not found in property '${property.name}'`
      );
    }

    const exists = roomType.rooms.some((r) => r.roomNumber === input.roomNumber);
    if (exists) {
      throw new ConflictError(
        `Room number '${input.roomNumber}' already exists in room type '${roomType.name}'`
      );
    }

    const newRoom: RoomEntity = {
      id: `room-${property.slug}-${input.roomNumber}`,
      roomTypeId: roomType.id,
      roomNumber: input.roomNumber,
      floor: input.floor || '1st Floor',
      status: RoomStatus.AVAILABLE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    roomType.rooms.push(newRoom);
    roomType.totalInventory = roomType.rooms.length;

    return newRoom;
  }

  async addImage(propertyIdOrSlug: string, imageUrl: string): Promise<PropertyEntity> {
    const property = await this.getPropertyByIdOrSlug(propertyIdOrSlug);
    if (!property.galleryImages.includes(imageUrl)) {
      property.galleryImages.push(imageUrl);
    }
    property.updatedAt = new Date();
    return property;
  }

  async checkAvailability(
    slugOrId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guests = 1
  ): Promise<RoomAvailabilityResult[]> {
    const property = await this.getPropertyByIdOrSlug(slugOrId);

    const checkIn = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    const checkOut = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

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
