export type Role = 'GUEST' | 'STAFF' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED';
export type EventType = 'WEDDING' | 'CORPORATE' | 'PRIVATE_DINING' | 'SHOOT' | 'OTHER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
}

export interface RoomType {
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
}

export interface PropertySummary {
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
  roomTypesCount: number;
  startingPrice: number;
}

export interface PropertyDetail extends PropertySummary {
  contactPhone: string;
  contactEmail: string;
  roomTypes: RoomType[];
}

export interface RoomAvailability {
  roomType: RoomType;
  totalInventory: number;
  availableInventory: number;
  isAvailable: boolean;
  totalPrice: number;
  nights: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  userId?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
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
    roomType?: RoomType;
  }[];
  createdAt: string;
}

export interface Enquiry {
  id: string;
  propertyId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  eventType: EventType;
  tentativeDate?: string | null;
  estimatedGuests?: number | null;
  message: string;
  status: EnquiryStatus;
  internalNotes?: string | null;
  createdAt: string;
}

export interface StaffDashboardData {
  metrics: {
    todayCheckInsCount: number;
    todayCheckOutsCount: number;
    currentInHouseCount: number;
    totalRooms: number;
    availableRooms: number;
    occupancyRate: number;
    pendingEnquiriesCount: number;
  };
  todayArrivals: Booking[];
  todayDepartures: Booking[];
  recentBookings: Booking[];
}

export interface OccupancyGridData {
  dates: string[];
  grid: {
    propertyId: string;
    propertyName: string;
    propertySlug: string;
    roomTypes: {
      roomTypeId: string;
      roomTypeName: string;
      basePrice: number;
      totalInventory: number;
      dates: {
        date: string;
        total: number;
        booked: number;
        available: number;
      }[];
    }[];
  }[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
