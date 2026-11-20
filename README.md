# Hotel Full-Stack Platform: The Bombay Reserve

A production-grade booking, enquiry, and operational platform for a fictional Mumbai boutique hotel collective with 14 distinctive properties across Mumbai's historic and coastal precincts.

## Monorepo Architecture
- **/client**: React 18 + Vite + TypeScript + Tailwind CSS + React Router
- **/server**: Node.js + Express + TypeScript + PostgreSQL with Prisma + Pino structured logging + Zod validation + Helmet + CORS + Express Rate Limit
- **/docs**: System architecture diagrams, OpenAPI specifications, database ERD, and deployment runbooks
- **/.github/workflows**: Automated CI pipeline running lint, typecheck, tests, and builds

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

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` templates to `.env` in root, `/server`, and `/client`:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Generate Database Client & Seed Data
```bash
npm run prisma:generate --workspace=server
npm run prisma:seed --workspace=server
```

### 4. Run Development Servers
```bash
# Terminal 1: Express Server (Port 4000)
npm run dev:server

# Terminal 2: Vite Client (Port 5173)
npm run dev:client
```

### 5. Run Automated Tests
```bash
npm test
```

## Documentation
- [`/docs/architecture.md`](./docs/architecture.md): Architectural diagram and data flow.
- [`/docs/API_SPEC.md`](./docs/API_SPEC.md): Full REST API endpoint reference.
- [`/docs/DATABASE_ERD.md`](./docs/DATABASE_ERD.md): Database entity relationships and property catalog.
- [`/docs/DEPLOYMENT_RUNBOOK.md`](./docs/DEPLOYMENT_RUNBOOK.md): Deployment and operational guide.
