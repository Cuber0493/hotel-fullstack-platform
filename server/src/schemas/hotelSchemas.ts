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

export const createBookingSchema = z.object({
  propertySlug: z.string().min(1, 'Property slug is required'),
  roomTypeSlug: z.string().min(1, 'Room type slug is required'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be in YYYY-MM-DD format'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be in YYYY-MM-DD format'),
  totalGuests: z.coerce.number().min(1, 'At least 1 guest is required'),
  guestName: z.string().min(2, 'Guest full name must be at least 2 characters'),
  guestEmail: z.string().email('Please enter a valid guest email'),
  guestPhone: z.string().min(8, 'Phone number must be at least 8 digits'),
  specialRequests: z.string().max(500).optional(),
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

export type PropertyQuery = z.infer<typeof propertyQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryStatusInput = z.infer<typeof updateEnquiryStatusSchema>;
