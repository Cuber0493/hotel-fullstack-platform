# The Bombay Reserve: Luxury Hotel Full-Stack Platform

A production-grade hotel booking, enquiry, and operational analytics platform for a Mumbai luxury boutique collective featuring **14 distinctive properties** across Mumbai's historic and coastal precincts.

---

## 1. Overview

**The Bombay Reserve** platform provides a bespoke digital guest experience for luxury travelers and an operational suite for general managers. Built as a high-performance TypeScript monorepo, it pairs a React 18 Single Page Application with an Express and PostgreSQL backend, offering transaction-safe reservations, silent authentication refresh, real-time availability search, and executive financial performance analytics.

### The 14 Boutique Properties
1. **The Colaba Colonial** (Colaba, South Mumbai)
2. **Marine Drive Bayview** (Marine Drive)
3. **Kala Ghoda Art House** (Kala Ghoda Arts District)
4. **The Malabar Verandah** (Malabar Hill)
5. **Bandra Bohemian Villa** (Pali Hill, Bandra West)
6. **Bandstand Ocean Mist** (Bandstand, Bandra West)
7. **Juhu Palms Retreat** (Juhu Beach)
8. **Versova Coastal Sanctuary** (Versova)
9. **Worli Sea Face Glasshouse** (Worli Sea Face)
10. **Powai Lake Pavilions** (Powai)
11. **BKC Executive Boutique** (Bandra Kurla Complex)
12. **Fort Heritage Chambers** (Fort Historic District)
13. **Dadar Parsi Haven** (Parsi Colony, Dadar)
14. **Girgaon Sunset Mansion** (Girgaon Chowpatty)

---

## 2. Key Features

- **Real-Time Availability & Room Search**: Multi-filter search engine querying across properties, date windows, guest counts, price thresholds, and amenities with sub-50ms latency.
- **Transaction-Safe Reservations**: ACID database transactions preventing double-booking conflicts across overlapping dates.
- **Enterprise Authentication & Security**:
  - 15-minute access JWTs held strictly in-memory in the browser.
  - Refresh tokens stored as cryptographic SHA-256 hashes in PostgreSQL and transmitted via `httpOnly`, `secure: true`, `sameSite: 'none'` cookies.
  - Automatic refresh token rotation on each request with immediate family revocation upon reuse detection.
  - Role-Based Access Control (`GUEST`, `ADMIN`) guarding privileged routes.
- **Executive Analytics Dashboard**:
  - Live calculation of core hospitality KPIs: **Occupancy Rate**, **Average Daily Rate (ADR)**, and **Revenue Per Available Room (RevPAR)**.
  - Strict mathematical identity guarantee: $\text{RevPAR} = \text{Occupancy Rate} \times \text{ADR}$.
  - Boundary-clipped date aggregation handling multi-night bookings crossing query ranges.
  - Daily and monthly revenue trend charts.
- **Bespoke Event & Private Dining Enquiries**: Public submission portal for courtyard weddings, rooftop dinners, and film shoots with an administrative triage pipeline (`NEW`, `CONTACTED`, `QUOTED`, `CLOSED`).
- **Media Asset Storage**: Cloudinary integration for uploading and serving high-resolution photography.
- **Interactive OpenAPI Documentation**: Live Swagger UI explorer served at `/api/docs` and `/api/docs/openapi.json`.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS, Lucide React, React Router v6, Axios |
| **Backend** | Node.js 20, Express 4, TypeScript 5, Prisma ORM 5, Zod, Helmet, CORS, Compression, Pino |
| **Database** | PostgreSQL 16 (Neon / Render Postgres) |
| **Media Storage**| Cloudinary CDN |
| **Testing** | Vitest, React Testing Library, Supertest, JSDOM, v8 Coverage Provider |
| **CI/CD** | GitHub Actions (Postgres 16 container, Gitleaks secret scanner, typecheck, tests, build) |
| **Hosting** | Render (Express Web Service via `render.yaml`), Vercel (React SPA via `vercel.json`) |

---

## 4. Local Setup & Installation

### Prerequisites
- **Node.js**: v20+ or v22+
- **npm**: v10+ (workspaces enabled)
- **PostgreSQL**: v14+ (optional for local mock testing; required for live DB integration)

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd "Hotel Full-Stack Platform"
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` templates to `.env`:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Step 3: Initialize Database & Seed
```bash
# Generate Prisma Client
npm run prisma:generate --workspace=server

# Deploy migrations and seed baseline Mumbai properties
npm run prisma:migrate:deploy --workspace=server
npm run prisma:seed --workspace=server
```

### Step 4: Start Development Servers
```bash
# Run both backend and frontend concurrently
npm run dev:server    # Terminal 1: Express API on http://localhost:4000
npm run dev:client    # Terminal 2: Vite Client on http://localhost:5173
```
- **Web Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000/api`
- **Interactive Swagger Docs**: `http://localhost:4000/api/docs`
- **Health Check**: `http://localhost:4000/api/health`

---

## 5. Required Environment Variables (Names Only)

> [!IMPORTANT]
> In accordance with security standards, only environment variable names are documented. Never commit or transmit secret values in chat or version control. Configure these variables directly in your host dashboards.

### Database (Neon / Render PostgreSQL)
| Variable Name | Purpose |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with SSL mode enabled (`?sslmode=require`) |

### Backend Web Service (Render)
| Variable Name | Purpose |
| :--- | :--- |
| `NODE_ENV` | Environment identifier (set to `production`) |
| `PORT` | HTTP port for the web service (defaults to `10000` on Render) |
| `DATABASE_URL` | PostgreSQL database connection string |
| `JWT_SECRET` | Secret key for signing and verifying JSON Web Tokens (min 32 characters) |
| `JWT_EXPIRES_IN` | Access token lifespan (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_DAYS` | Refresh token lifespan (e.g. `7`) |
| `CORS_ORIGIN` | Allowed frontend origin URL(s) (e.g. `https://the-bombay-reserve.vercel.app`) |
| `USD_TO_INR_RATE` | Currency conversion rate for international tariff calculations |
| `ADMIN_EMAIL` | Initial executive administrator email |
| `ADMIN_PASSWORD` | Initial executive administrator password |
| `ADMIN_NAME` | Initial executive administrator display name |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier for property image storage |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `REDIS_URL` | Redis / Upstash connection string (`rediss://...`) for BullMQ queue |
| `RESEND_API_KEY` | Resend API key for guest booking confirmation and admin alert emails |
| `EMAIL_FROM` | Verified sender address (e.g. `concierge@bombayreserve.com`) |
| `LOG_LEVEL` | Pino logging threshold (`info`, `warn`, `error`, `debug`) |

### Background Worker Process (Render)
| Variable Name | Purpose |
| :--- | :--- |
| `NODE_ENV` | Environment identifier (set to `production`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis / Upstash connection string for BullMQ worker |
| `RESEND_API_KEY` | Resend API key for email dispatches |
| `EMAIL_FROM` | Sender email address |
| `ADMIN_EMAIL` | Administrator recipient email for enquiries and nightly metrics |

### Frontend Web Application (Vercel)
| Variable Name | Purpose |
| :--- | :--- |
| `VITE_API_URL` | Full URL to the live Render backend API (e.g. `https://the-bombay-reserve-api.onrender.com/api`) |
| `VITE_API_BASE_URL` | *(Optional alias)* Full URL to the live Render backend API |

---

## 6. Running Automated Tests

```bash
# Run all unit and integration tests across monorepo
npm test

# Run tests with complete v8 statement and branch coverage reports
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch --workspace=server
npm run test:watch --workspace=client

# Perform strict TypeScript type checking across all workspaces
npm run typecheck
```

---

## 7. Production Deployment

The repository includes ready-to-deploy configuration files:
- **Render Backend Blueprint** ([`render.yaml`](./render.yaml)): Automatically deploys the Express web service, runs `prisma migrate deploy` on release, and provisions environment variables.
- **Vercel Frontend Configuration** ([`vercel.json`](./vercel.json)): Single Page Application rewrites for client-side routing on Vercel Edge Network.
- Complete step-by-step dashboard click instructions are provided in [`docs/DEPLOYMENT_RUNBOOK.md`](./docs/DEPLOYMENT_RUNBOOK.md).

---

## 8. Monorepo Project Structure

```
Hotel-Full-Stack-Platform/
├── .github/
│   └── workflows/
│       └── ci.yml               # Multi-stage CI: Gitleaks, Postgres 16, Tests, Build
├── client/                      # React 18 Frontend Workspace
│   ├── public/                  # Static assets and favicon
│   ├── src/
│   │   ├── api/                 # Axios client with silent refresh interceptor
│   │   ├── components/          # Reusable UI (Navbar, Footer, Route Guards)
│   │   ├── context/             # AuthContext (In-memory token state)
│   │   ├── pages/               # Lazy-loaded page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── SearchResultsPage.tsx
│   │   │   ├── PropertyDetailPage.tsx
│   │   │   ├── BookingFlowPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── MyBookingsPage.tsx
│   │   │   ├── EnquiriesPage.tsx
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   └── AdminManagementPage.tsx
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Root router & layout
│   │   └── main.tsx             # Application bootstrap
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vercel.json              # Client SPA rewrites
│   └── vite.config.ts           # Vite + Vitest config
├── server/                      # Express Backend Workspace
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL models & composite indexes
│   │   └── seed.ts              # Idempotent database seed script
│   ├── src/
│   │   ├── config/              # Environment schema & validation
│   │   ├── controllers/         # HTTP controller handlers
│   │   ├── docs/                # OpenAPI 3.0 specification generator
│   │   ├── errors/              # Typed AppError classes
│   │   ├── middleware/          # Helmet, CORS, Rate Limit, Auth, Validation
│   │   ├── repositories/        # Database & DataStore abstraction
│   │   ├── routes/              # Express API routers
│   │   ├── schemas/             # Zod validation schemas
│   │   ├── scripts/             # Data cleaning, raw generation, and import
│   │   ├── services/            # Business domain services
│   │   ├── app.ts               # Express application composition
│   │   └── server.ts            # HTTP server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts         # Server Vitest configuration
├── docs/                        # Engineering Documentation
│   ├── API.md                   # Complete REST API reference
│   ├── architecture.md          # Architecture diagrams & component breakdown
│   ├── DATABASE_ERD.md          # Database ERD & entity catalog
│   ├── DEPLOYMENT_RUNBOOK.md    # Step-by-step production deployment guide
│   ├── metrics.md               # Financial metrics mathematical derivation
│   └── scaling.md               # In-depth architectural bottleneck analysis
├── .gitleaks.toml               # Secret scanning allowlist configuration
├── render.yaml                  # Render Cloud Blueprint specification
├── vercel.json                  # Root Vercel monorepo deployment config
└── package.json                 # Monorepo root package definition
```
