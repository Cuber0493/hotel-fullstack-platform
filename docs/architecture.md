# System Architecture: The Bombay Reserve Full-Stack Platform

This document describes the end-to-end architecture, communication contracts, database topology, and security mechanisms of **The Bombay Reserve** luxury boutique hotel platform.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientTier ["Frontend Client Tier (Vercel)"]
        SPA["React 18 SPA (Vite + TypeScript)"]
        Router["React Router v6 (Lazy Route Splitting)"]
        AuthContext["AuthContext (In-Memory Access Token)"]
        AxiosClient["Axios Client (Silent Refresh Interceptor)"]
        
        SPA --> Router --> AuthContext --> AxiosClient
    end

    subgraph EdgeGate ["Edge Security & Load Balancing (Render)"]
        ReverseProxy["Render Edge TLS / Reverse Proxy"]
    end

    subgraph BackendTier ["Express Backend Service Tier (Node.js 20)"]
        ExpressApp["Express Application Server"]
        
        subgraph MiddlewarePipeline ["Middleware Pipeline"]
            MW_Helmet["Helmet (Security Headers)"]
            MW_CORS["CORS (Restricted to Vercel Domains)"]
            MW_Comp["Compression (Gzip / Deflate)"]
            MW_Limit["Express Rate Limiter (IP-Based)"]
            MW_Logger["Pino HTTP Structured Logger"]
            MW_Auth["Auth Middleware (JWT Verify & RBAC)"]
            MW_Val["Zod Schema Validation"]
            MW_Error["Centralized Standard Error Handler"]
            
            MW_Helmet --> MW_CORS --> MW_Comp --> MW_Limit --> MW_Logger --> MW_Auth --> MW_Val
        end

        subgraph ServiceLayer ["Domain Services & Business Logic"]
            AuthService["AuthService (Bcrypt + Token Family Rotation)"]
            PropertyService["PropertyService (Catalog & Filtering)"]
            SearchService["SearchService (Room Availability Search)"]
            BookingService["BookingService (Transactional Overlap Guard)"]
            MetricsService["MetricsService (SQL Boundary Clipping: RevPAR, ADR)"]
            UploadService["UploadService (Cloudinary Integration)"]
        end

        subgraph OpenAPIDocs ["API Documentation"]
            SwaggerUI["Swagger UI (/api/docs)"]
            OpenAPIJSON["OpenAPI 3.0 Spec (/api/docs/openapi.json)"]
        end

        ExpressApp --> MiddlewarePipeline --> ServiceLayer
        ExpressApp --> OpenAPIDocs
        ServiceLayer --> MW_Error
    end

    subgraph PersistenceTier ["Data & Asset Persistence Tier"]
        DB[("PostgreSQL 16 (Neon / Render)\n- Composite Indexes\n- ACID Transaction Engine")]
        CloudinaryCDN["Cloudinary Object CDN\n(High-Resolution Photography)"]
    end

    %% Network Interconnections
    AxiosClient -- "HTTPS (withCredentials: true)\nBearer JWT + HttpOnly Cookie" --> ReverseProxy
    ReverseProxy --> ExpressApp
    ServiceLayer -- "Prisma Client (Connection Pooled)" --> DB
    UploadService -- "Signed API Upload" --> CloudinaryCDN
    CloudinaryCDN -- "Optimized WebP Delivery" --> SPA
```

---

## 2. Core Architectural Components

### 1. Frontend Client Layer (`/client`)
- **Technology Stack**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6.
- **Key Subsystems**:
  - **In-Memory Access Token**: Access JWTs are held exclusively in memory within `AuthContext` to prevent XSS credential exfiltration.
  - **Axios Silent Refresh Interceptor**: When an API call returns `401 Unauthorized`, an Axios interceptor catches the response, queues concurrent requests, hits `POST /api/auth/refresh` (delivering the browser's `httpOnly` cookie), receives a fresh access token, and transparently replays all queued calls without user disruption.
  - **Route Guards**: `<ProtectedRoute>` guards member reservations; `<AdminRoute>` guards executive operations, rejecting non-admin users with a 403 access banner.
  - **Performance Optimization**: Dynamic `React.lazy()` chunking across all 10 page routes, reducing initial payload to <85 kB gzip.

---

### 2. Backend API Gateway & Server (`/server`)
- **Technology Stack**: Node.js 20, Express 4, TypeScript, Prisma ORM, Zod, Pino, Helmet, CORS, Compression.
- **Key Subsystems**:
  - **Layered Middleware Pipeline**:
    1. `helmet`: Protects against clickjacking, sniffing, and cross-site injections.
    2. `cors`: Restricts cross-origin requests to verified Vercel production and preview domains with `credentials: true`.
    3. `compression`: Gzip/Deflate compression for fast JSON transmission.
    4. `express-rate-limit`: Shields authentication endpoints from brute-force attempts (10 req/15 min).
    5. `pino-http`: Structured JSON logging omitting sensitive credentials.
    6. `validateBody` / `validateQuery`: Strict runtime validation via Zod schemas.
    7. `errorHandler`: Translates all domain errors into uniform JSON contracts:
       ```json
       { "error": { "code": "STRING_CODE", "message": "Human readable detail" } }
       ```
  - **Interactive Documentation**: Swagger UI served live at `/api/docs` with raw spec at `/api/docs/openapi.json`.

---

### 3. Data Tier & Relational Schema (PostgreSQL + Prisma)
- **Data Models**:
  - `User`: Admin, Staff, and Guest accounts with bcrypt password hashing ($10\times$ work factor).
  - `RefreshToken`: Cryptographic SHA-256 token hashes with rotation lineage and automatic family revocation upon reuse detection.
  - `Property`: The 14 curated Mumbai boutique properties with neighborhood provenance.
  - `RoomType`: 42 curated room categories with INR tariffs, bed configurations, and capacity rules.
  - `Room`: Physical room inventory instances with availability states (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`).
  - `Booking`: Reservation contracts with check-in/out dates, guest counts, total INR tariffs, and lifecycle states (`CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`).
  - `Enquiry`: Bespoke event, shoot, and dining enquiries with triage pipeline status.
- **Composite Indexes**:
  - `@@index([status, checkIn, checkOut])` on `Booking` for sub-10ms overlap searches.
  - `@@index([propertyId])` and `@@index([roomTypeId])` for relational joins.
  - `@@index([email])` on `User` for rapid login lookups.

---

## 3. Core Sequence Diagrams

### A. Authentication & Refresh Token Rotation

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest Browser
    participant API as Express API (/api/auth)
    participant AuthSvc as AuthService
    participant DB as PostgreSQL (Prisma)

    Guest->>API: POST /login { email, password }
    API->>AuthSvc: login(credentials)
    AuthSvc->>DB: Find User by Email
    DB-->>AuthSvc: User Record + Password Hash
    AuthSvc->>AuthSvc: Verify Bcrypt Hash
    AuthSvc->>AuthSvc: Generate Access JWT (15m) & Refresh Token (7d)
    AuthSvc->>DB: Store SHA-256 Hashed Refresh Token
    AuthSvc-->>API: { user, accessToken, refreshToken }
    API-->>Guest: 200 OK + Set-Cookie: refreshToken (HttpOnly; Secure; SameSite=None)

    Note over Guest, API: 15 minutes elapse; Access JWT expires
    Guest->>API: GET /api/bookings (Access JWT Expired)
    API-->>Guest: 401 Unauthorized

    Guest->>API: POST /api/auth/refresh (Cookie Auto-Attached)
    API->>AuthSvc: refresh(oldToken)
    AuthSvc->>DB: Lookup Token Hash
    alt Token was already revoked / reused
        AuthSvc->>DB: Revoke entire token family (Security Breach)
        AuthSvc-->>API: 401 Unauthorized (Reuse Detected)
    else Token is valid
        AuthSvc->>DB: Mark old token REVOKED
        AuthSvc->>DB: Issue & Store new rotated token
        AuthSvc-->>API: { accessToken, newRefreshToken }
        API-->>Guest: 200 OK + Set-Cookie: newRefreshToken
        Guest->>API: Replay GET /api/bookings (with new Access Token)
        API-->>Guest: 200 OK [Bookings Payload]
    end
```

---

### B. Transactional Room Booking & Overlap Guard

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest Browser
    participant API as Express API (/api/bookings)
    participant BkSvc as BookingService
    participant DB as PostgreSQL (Prisma Transaction)

    Guest->>API: POST /api/bookings { roomId, checkIn, checkOut, guests }
    API->>BkSvc: createBooking(payload, userId)
    BkSvc->>DB: BEGIN TRANSACTION (Serializable / Isolation)
    BkSvc->>DB: SELECT bookings WHERE roomId = id AND status != CANCELLED AND checkIn < targetOut AND checkOut > targetIn
    
    alt Overlapping booking found
        DB-->>BkSvc: Existing Booking Row Found
        BkSvc->>DB: ROLLBACK
        BkSvc-->>API: 409 Conflict (DOUBLE_BOOKING_CONFLICT)
        API-->>Guest: 409 Conflict: "Room already reserved for chosen dates"
    else Room is completely available
        DB-->>BkSvc: 0 Overlapping Rows
        BkSvc->>BkSvc: Calculate Total = Nights * RoomType BaseRate
        BkSvc->>DB: INSERT INTO bookings (bookingCode, status='CONFIRMED', totalInr, ...)
        BkSvc->>DB: COMMIT TRANSACTION
        BkSvc-->>API: Confirmed Booking Record
        API-->>Guest: 201 Created { bookingCode: "TBR-BOM-882194", status: "CONFIRMED" }
    end
```

---

### C. Executive Dashboard Metrics Engine (SQL Boundary Clipping)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Executive Dashboard
    participant API as Express API (/api/admin/metrics)
    participant MetSvc as MetricsService
    participant DB as PostgreSQL (Prisma)

    Admin->>API: GET /api/admin/metrics?from=2026-11-01&to=2026-11-30
    API->>MetSvc: getMetrics({ from, to, propertyId })
    MetSvc->>DB: Count total active rooms across selected properties
    MetSvc->>DB: Query active bookings intersecting [from, to] window
    Note over MetSvc, DB: Boundary Clipping:<br/>clippedNights = MIN(b.checkOut, to) - MAX(b.checkIn, from)<br/>revenue = clippedNights * dailyTariff
    MetSvc->>MetSvc: Aggregate Room-Nights Sold & Room Revenue
    MetSvc->>MetSvc: Calculate Available Room-Nights = TotalRooms * TotalDays
    MetSvc->>MetSvc: Compute Formulas:<br/>Occupancy = Sold / Available<br/>ADR = Revenue / Sold<br/>RevPAR = Revenue / Available
    MetSvc->>MetSvc: Assert Mathematical Identity: RevPAR == Occupancy * ADR
    MetSvc-->>API: Metrics Payload (Overall, Per-Property, Daily Trends)
    API-->>Admin: 200 OK [KPI Cards, Revenue Charts, Hotel Table]
```
