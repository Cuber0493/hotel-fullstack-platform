# Hotel Full-Stack Platform: The Bombay Reserve

A production-grade booking, enquiry, and operational platform for a fictional Mumbai boutique hotel collective with 14 distinctive properties across Mumbai's historic and coastal precincts.

## Monorepo Architecture
- **/client**: React 18 + Vite + TypeScript + Tailwind CSS + React Router + Axios (with silent refresh interceptor)
- **/server**: Node.js + Express + TypeScript + PostgreSQL with Prisma + Pino structured logging + Zod validation + Helmet + CORS + Express Rate Limit
- **/docs**: System architecture diagrams, OpenAPI specifications, database ERD, metrics formulations, and deployment runbooks
- **/.github/workflows**: Automated CI pipeline running secret scanning (gitleaks), format/typecheck, PostgreSQL service container, automated test suites with coverage, and production builds
- **render.yaml**: Infrastructure as Code Blueprint for Render backend web service
- **vercel.json**: Frontend SPA routing and workspace build configuration for Vercel

---

## The 14 Boutique Properties
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

## Production Deployment & Services

The platform is designed for cloud deployment across the following services:
- **Frontend**: Hosted on [Vercel](https://vercel.com) (React 18 SPA with client-side rewrites)
- **Backend**: Hosted on [Render](https://render.com) (Node.js Express + Prisma ORM via `render.yaml`)
- **Database**: Managed PostgreSQL on [Neon](https://neon.tech) or [Render PostgreSQL](https://render.com)
- **Media Storage**: [Cloudinary](https://cloudinary.com) for property image uploads

---

## Required Environment Variables (Names Only)

> [!IMPORTANT]
> In accordance with security standards, only environment variable names are documented below. Never commit or transmit secret values in chat or version control. Configure these variables directly in your host dashboards.

### 1. Database (Neon / Render PostgreSQL)
| Variable Name | Purpose |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with SSL mode enabled (`?sslmode=require`) |

### 2. Backend Web Service (Render)
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
| `LOG_LEVEL` | Pino logging threshold (`info`, `warn`, `error`, `debug`) |

### 3. Frontend Web Application (Vercel)
| Variable Name | Purpose |
| :--- | :--- |
| `VITE_API_URL` | Full URL to the live Render backend API (e.g. `https://the-bombay-reserve-api.onrender.com/api`) |
| `VITE_API_BASE_URL` | *(Optional alias)* Full URL to the live Render backend API |

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Database Client & Seed Data
```bash
npm run prisma:generate --workspace=server
npm run prisma:seed --workspace=server
```

### 3. Run Development Servers
```bash
# Terminal 1: Express Server (Port 4000)
npm run dev:server

# Terminal 2: Vite Client (Port 5173)
npm run dev:client
```

### 4. Run Automated Tests & Coverage
```bash
# Run all tests across workspaces
npm test

# Run tests with v8 coverage reports
npm run test:coverage
```

---

## Documentation
- [`/docs/architecture.md`](./docs/architecture.md): Architectural diagram and data flow.
- [`/docs/API_SPEC.md`](./docs/API_SPEC.md): Full REST API endpoint reference.
- [`/docs/DATABASE_ERD.md`](./docs/DATABASE_ERD.md): Database entity relationships and property catalog.
- [`/docs/metrics.md`](./docs/metrics.md): Dashboard KPI formulas (Occupancy, ADR, RevPAR).
- [`/docs/DEPLOYMENT_RUNBOOK.md`](./docs/DEPLOYMENT_RUNBOOK.md): Step-by-step production deployment checklist and verification guide.
