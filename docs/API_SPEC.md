# API Specification: The Bombay Reserve

All API endpoints are versioned under `/api/v1`.

## Authentication & Profiles

### 1. Register Guest Account
- **Endpoint**: `POST /api/v1/auth/register`
- **Request Body**:
```json
{
  "email": "priya.sharma@example.com",
  "password": "Password@123",
  "fullName": "Priya Sharma",
  "phone": "+91 98200 11003"
}
```
- **Response** (`201 Created`):
```json
{
  "user": {
    "id": "usr-uuid",
    "email": "priya.sharma@example.com",
    "fullName": "Priya Sharma",
    "phone": "+91 98200 11003",
    "role": "GUEST",
    "createdAt": "2026-11-20T12:00:00.000Z"
  },
  "accessToken": "<ACCESS_TOKEN>"
"token": "<TOKEN>"
```

### 2. Login User
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
```json
{
  "email": "staff@bombayreserve.com",
  "password": "Password@123"
}
```
- **Response** (`200 OK`):
```json
{
  "user": {
    "id": "usr-staff-1",
    "email": "staff@bombayreserve.com",
    "fullName": "Rohan D'Souza",
    "role": "STAFF"
  },
  "accessToken": "<ACCESS_TOKEN>"
"token": "<TOKEN>"
}
```

### 3. Current User Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
```json
{
  "user": {
    "id": "usr-staff-1",
    "email": "staff@bombayreserve.com",
    "fullName": "Rohan D'Souza",
    "role": "STAFF"
  }
}
```

---

## Properties & Availability

### 4. List Properties
- **Endpoint**: `GET /api/v1/properties`
- **Query Parameters**:
  - `neighborhood` (optional, string): Filter by area (e.g. `Colaba`, `Bandra`)
  - `search` (optional, string): Keyword search in name or description
  - `minPrice`, `maxPrice` (optional, number): Filter by base price in INR
  - `amenity` (optional, string): Filter by amenity
- **Response** (`200 OK`):
```json
{
  "total": 14,
  "properties": [
    {
      "id": "prop-the-colaba-colonial",
      "slug": "the-colaba-colonial",
      "name": "The Colaba Colonial",
      "neighborhood": "Colaba, South Mumbai",
      "address": "14 B.K. Boman Behram Marg, Colaba",
      "startingPrice": 15500,
      "roomTypesCount": 3
    }
  ]
}
```

### 5. Property Detail
- **Endpoint**: `GET /api/v1/properties/:slug`
- **Response** (`200 OK`): Full property object with `roomTypes`, `amenities`, and contact info.

### 6. Real-Time Room Availability
- **Endpoint**: `GET /api/v1/properties/:slug/availability`
- **Query Parameters**:
  - `checkInDate` (required, `YYYY-MM-DD`)
  - `checkOutDate` (required, `YYYY-MM-DD`)
  - `guests` (optional, number, default `1`)
- **Response** (`200 OK`):
```json
{
  "propertySlug": "marine-drive-bayview",
  "checkInDate": "2026-12-10",
  "checkOutDate": "2026-12-12",
  "roomTypes": [
    {
      "roomType": { "slug": "sea-breeze-deluxe", "name": "Sea Breeze Deluxe", "basePrice": 19500 },
      "totalInventory": 4,
      "availableInventory": 3,
      "isAvailable": true,
      "totalPrice": 39000,
      "nights": 2
    }
  ]
}
```

---

## Bookings

### 7. Create Reservation
- **Endpoint**: `POST /api/v1/bookings`
- **Headers**: Optional `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "propertySlug": "marine-drive-bayview",
  "roomTypeSlug": "sea-breeze-deluxe",
  "checkInDate": "2026-12-10",
  "checkOutDate": "2026-12-12",
  "totalGuests": 2,
  "guestName": "Anand Mahindra",
  "guestEmail": "anand@example.com",
  "guestPhone": "+91 98201 99887",
  "specialRequests": "High floor requested"
}
```
- **Response** (`201 Created`):
```json
{
  "booking": {
    "id": "bk-uuid",
    "bookingCode": "TBR-BOM-SFMDNE",
    "guestName": "Anand Mahindra",
    "status": "CONFIRMED",
    "totalAmount": 39000
  },
  "message": "Reservation confirmed successfully"
}
```

### 8. Find Booking by Code
- **Endpoint**: `GET /api/v1/bookings/:bookingCode`
- **Response** (`200 OK`): Full booking voucher object.

### 9. Cancel Reservation
- **Endpoint**: `PATCH /api/v1/bookings/:id/cancel`
- **Request Body**: `{ "reason": "Change of itinerary" }`
- **Response** (`200 OK`): Updated booking with `status: "CANCELLED"`.

---

## Staff & Front-Desk Operations

*All endpoints require `Authorization: Bearer <token>` with `role: "STAFF"` or `"ADMIN"`.*

### 10. Operational Dashboard Metrics
- **Endpoint**: `GET /api/v1/staff/dashboard`
- **Response** (`200 OK`): Returns `metrics` (check-ins, check-outs, in-house, occupancy %), `todayArrivals`, `todayDepartures`.

### 11. Staff Bookings Search
- **Endpoint**: `GET /api/v1/staff/bookings`
- **Query Parameters**: `status`, `propertySlug`, `search` (name/email/code), `date`.

### 12. Check-In / Check-Out Lifecycle
- **Endpoint**: `PATCH /api/v1/staff/bookings/:id/status`
- **Request Body**: `{ "status": "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" }`
- **Response** (`200 OK`)

### 13. 14-Day Occupancy Grid
- **Endpoint**: `GET /api/v1/staff/occupancy-grid?days=14`

### 14. Event Enquiries Management
- **Endpoint**: `GET /api/v1/staff/enquiries`
- **Endpoint**: `PATCH /api/v1/staff/enquiries/:id`
  - Body: `{ "status": "CONTACTED", "internalNotes": "Lookbook sent" }`
