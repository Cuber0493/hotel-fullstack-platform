import { z } from 'zod';
import { BookingStatus, EnquiryStatus } from '@prisma/client';

export const propertyQuerySchema = z.object({
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  amenity: z.string().optional(),
});

export const availabilityQuerySchema = z.object({
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be in YYYY-MM-DD format'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be in YYYY-MM-DD format'),
  guests: z.coerce.number().min(1).default(1),
});

export const createBookingSchema = z
  .object({
    propertySlug: z.string().optional(),
    propertyId: z.string().optional(),
    roomTypeSlug: z.string().optional(),
    roomTypeId: z.string().optional(),
    roomId: z.string().optional(),
    roomNumber: z.string().optional(),
    checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be in YYYY-MM-DD format').optional(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be in YYYY-MM-DD format').optional(),
    checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be in YYYY-MM-DD format').optional(),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be in YYYY-MM-DD format').optional(),
    totalGuests: z.coerce.number().min(1, 'At least 1 guest is required').optional(),
    guests: z.coerce.number().min(1).optional(),
    guestName: z.string().min(2, 'Guest full name must be at least 2 characters'),
    guestEmail: z.string().email('Please enter a valid guest email'),
    guestPhone: z.string().min(8, 'Phone number must be at least 8 digits'),
    specialRequests: z.string().max(500).optional(),
  })
  .refine((data) => Boolean(data.propertySlug || data.propertyId), {
    message: 'propertySlug or propertyId is required',
    path: ['propertyId'],
  })
  .refine((data) => Boolean(data.checkInDate || data.checkIn), {
    message: 'checkIn date is required',
    path: ['checkIn'],
  })
  .refine((data) => Boolean(data.checkOutDate || data.checkOut), {
    message: 'checkOut date is required',
    path: ['checkOut'],
  });

export const cancelBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  roomId: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const staffBookingsQuerySchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  propertySlug: z.string().optional(),
  search: z.string().optional(),
  date: z.string().optional(),
});

export const createEnquirySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  userId: z.string().optional(),
});

export const updateEnquiryStatusSchema = z.object({
  status: z.nativeEnum(EnquiryStatus),
  internalNotes: z.string().optional(),
});

export const createPropertySchema = z.object({
  name: z.string().min(2, 'Property name must be at least 2 characters'),
  neighborhood: z.string().min(2, 'Neighborhood must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  city: z.string().default('Mumbai'),
  amenities: z.array(z.string()).default([]),
  heroImage: z.string().optional(),
  galleryImages: z.array(z.string()).default([]),
  contactPhone: z.string().optional().default('+91 22 6900 1100'),
  contactEmail: z.string().email().optional().default('concierge@bombayreserve.com'),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createRoomSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  roomTypeId: z.string().min(1, 'Room Type ID is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  floor: z.string().optional(),
});

export const roomSearchQuerySchema = z.object({
  city: z.string().optional(),
  propertyId: z.string().optional(),
  property: z.string().optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be YYYY-MM-DD').optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be YYYY-MM-DD').optional(),
  guests: z.coerce.number().min(1).default(1),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  roomType: z.string().optional(),
  amenities: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'capacity_desc', 'name_asc']).default('price_asc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type PropertyQuery = z.infer<typeof propertyQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryStatusInput = z.infer<typeof updateEnquiryStatusSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type RoomSearchQuery = z.infer<typeof roomSearchQuerySchema>;
