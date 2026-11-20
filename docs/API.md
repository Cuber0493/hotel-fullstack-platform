# The Bombay Reserve REST API Reference

Comprehensive documentation for all REST API endpoints powering The Bombay Reserve luxury boutique hotel platform.

Interactive Swagger UI is served live at:
- **Web UI**: `/api/docs`
- **OpenAPI 3.0 JSON**: `/api/docs/openapi.json`

---

## 1. Authentication & Session Management

All authenticated endpoints require an `Authorization: Bearer <accessToken>` header. Access tokens are valid for 15 minutes. Long-lived refresh tokens are delivered in an `httpOnly`, `secure: true`, `sameSite: 'none'` cookie and automatically rotated.

### POST `/api/auth/register`
Creates a new guest account.
- **Access**: Public
- **Rate Limit**: 10 requests per 15 minutes
- **Body**:
  ```json
  {
    "name": "Natasha Poonawalla",
    "email": "natasha@example.com",
    "password": "Password@123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "user": {
      "id": "usr-uuid",
      "name": "Natasha Poonawalla",
      "email": "natasha@example.com",
      "role": "GUEST"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
  *Sets cookie `refreshToken=<token>; HttpOnly; Secure; SameSite=None; Path=/`*

### POST `/api/auth/login`
Authenticates user credentials.
- **Access**: Public
- **Rate Limit**: 10 requests per 15 minutes
- **Body**:
  ```json
  {
    "email": "admin@bombayreserve.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK)**: Returns `{ user, accessToken }` and sets rotated refresh cookie.

### POST `/api/auth/refresh`
Rotates the refresh token family and delivers a new access token.
- **Access**: Public (presents cookie or optional JSON payload)
- **Response (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
- **Security Guard**: Detects token reuse. Replaying an already rotated token immediately triggers revocation of the entire family and returns `401 Unauthorized`.

### POST `/api/auth/logout`
Revokes active refresh session and instructs browser to delete cookie.
- **Access**: Public / Authenticated
- **Response (200 OK)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### GET `/api/auth/me`
Retrieves identity of currently authenticated caller.
- **Access**: Bearer JWT required

---

## 2. Properties & Catalog

### GET `/api/properties`
Lists all 14 curated Mumbai boutique properties with photography, amenities, and address details.
- **Access**: Public
- **Cache-Control**: `public, max-age=60, stale-while-revalidate=120`
- **Response (200 OK)**:
  ```json
  {
    "properties": [
      {
        "id": "prop-the-colaba-colonial",
        "name": "The Colaba Colonial",
        "city": "Mumbai",
        "address": "14 Arthur Bunder Road, Colaba, Mumbai 400005",
        "description": "Victorian Indo-Saracenic architectural gem...",
        "amenities": ["High-Speed Wi-Fi", "Swimming Pool", "Spa & Wellness"],
        "imageUrls": ["https://images.unsplash.com/..."]
      }
    ]
  }
  ```

### GET `/api/properties/:id`
Retrieves single property profile including available room categories and inventory.
- **Access**: Public

### POST `/api/properties`
Creates a new property record.
- **Access**: Admin only (`Role.ADMIN`)

### POST `/api/properties/:id/images`
Uploads high-resolution photography to Cloudinary.
- **Access**: Admin only (`Role.ADMIN`)
- **Content-Type**: `multipart/form-data` (Field: `image`, max 5MB, jpeg/png/webp)

---

## 3. Room Search & Availability

### GET `/api/rooms/search`
Queries room categories based on real-time availability, guest count, price tier, and amenities.
- **Access**: Public
- **Parameters**:
  | Param | Type | Description |
  | :--- | :--- | :--- |
  | `checkIn` | `YYYY-MM-DD` | Target arrival date |
  | `checkOut` | `YYYY-MM-DD` | Target departure date |
  | `guests` | `number` | Required capacity |
  | `propertyId`| `string` | Filter by specific property |
  | `minPrice` | `number` | Minimum INR rate |
  | `maxPrice` | `number` | Maximum INR rate |
  | `page` | `number` | Pagination page (default 1) |
  | `limit` | `number` | Page size (default 10) |
  | `sort` | `string` | `price_asc`, `price_desc`, `name_asc` |

---

## 4. Bookings & Reservations

### POST `/api/bookings`
Reserves a physical room inside a database transaction with overlap prevention.
- **Access**: Authenticated (`GUEST` or `ADMIN`)
- **Body**:
  ```json
  {
    "roomId": "rm-colaba-101",
    "checkIn": "2026-12-10",
    "checkOut": "2026-12-14",
    "guests": 2,
    "guestName": "Tarun Khanna",
    "guestEmail": "tarun@example.com",
    "specialRequests": "High floor, quiet wing."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "booking": {
      "id": "bk-uuid",
      "bookingCode": "TBR-BOM-882194",
      "roomId": "rm-colaba-101",
      "checkIn": "2026-12-10",
      "checkOut": "2026-12-14",
      "guests": 2,
      "totalInr": 180000,
      "status": "CONFIRMED"
    }
  }
  ```
- **Double Booking Guard (409 Conflict)**:
  ```json
  {
    "error": {
      "code": "DOUBLE_BOOKING_CONFLICT",
      "message": "Selected room is already reserved for the chosen dates"
    }
  }
  ```

### GET `/api/bookings`
Lists bookings. Non-admin users see only their own reservations.
- **Access**: Authenticated

### POST `/api/bookings/:id/cancel`
Cancels reservation.
- **Access**: Booking Owner or Admin

---

## 5. Bespoke Event Enquiries

### POST `/api/enquiries`
Submits enquiry for private courtyard dining, weddings, corporate summits, or film shoots.
- **Access**: Public
- **Body**:
  ```json
  {
    "propertyId": "prop-the-colaba-colonial",
    "name": "Zubin Mehta",
    "email": "zubin@classical.in",
    "message": "Private courtyard dinner for 40 guests with string quartet acoustics."
  }
  ```

### GET `/api/enquiries`
Lists all enquiries.
- **Access**: Admin only

### PATCH `/api/enquiries/:id/status`
Updates enquiry status (`NEW`, `CONTACTED`, `QUOTED`, `CLOSED`).
- **Access**: Admin only

---

## 6. Executive Analytics (Admin Dashboard)

### GET `/api/admin/metrics`
Aggregates operational KPIs with mathematical identity $RevPAR = Occupancy \times ADR$.
- **Access**: Admin only (`Role.ADMIN`)
- **Parameters**: `propertyId` (optional), `from` (date), `to` (date)
- **Response (200 OK)**:
  ```json
  {
    "overall": {
      "occupancyRate": 0.75,
      "adr": 45000,
      "revpar": 33750,
      "totalRevenueInr": 3375000,
      "roomNightsSold": 75,
      "roomNightsAvailable": 100
    },
    "byProperty": [...],
    "dailyTrend": [...]
  }
  ```
