export type Role = 'GUEST' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  phone?: string | null;
  role: Role;
}

export interface RoomEntity {
  id: string;
  roomTypeId: string;
  roomNumber: string;
  floor: string;
  status: RoomStatus;
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
  rooms?: RoomEntity[];
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

export interface BookingItem {
  id: string;
  bookingId: string;
  roomTypeId: string;
  roomId?: string | null;
  nightPrice: number;
  roomType?: RoomType;
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
  items: BookingItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface Enquiry {
  id: string;
  userId?: string | null;
  propertyId: string;
  name: string;
  email: string;
  message: string;
  status: EnquiryStatus;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PropertyMetricItem {
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  totalRooms: number;
  roomNightsAvailable: number;
  roomNightsSold: number;
  roomRevenueInr: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface MetricSummary {
  totalRooms: number;
  roomNightsAvailable: number;
  roomNightsSold: number;
  roomRevenueInr: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface DailyTrendItem {
  date: string;
  roomNightsAvailable: number;
  roomNightsSold: number;
  roomRevenueInr: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface MonthlyTrendItem {
  month: string;
  roomNightsAvailable: number;
  roomNightsSold: number;
  roomRevenueInr: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface DashboardMetricsResponse {
  from: string;
  to: string;
  days: number;
  overall: MetricSummary;
  properties: PropertyMetricItem[];
  dailyTrends: DailyTrendItem[];
  monthlyTrends: MonthlyTrendItem[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
