# Deployment & Operational Runbook: The Bombay Reserve

## 1. Prerequisites
- **Node.js**: v20+ or v22+ (tested on Node.js v24)
- **npm**: v10+ (workspaces enabled)
- **PostgreSQL**: v14+ (optional for local/test runs; seamless in-memory fallback included for zero-friction development and automated CI)

---

## 2. Environment Configuration

Copy the `.env.example` templates to `.env` files in their respective folders:

### Root (`.env`):
```bash
NODE_ENV=development
```

### Server (`server/.env`):
```bash
PORT=4000
NODE_ENV=development
LOG_LEVEL=info

# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/the_bombay_reserve?schema=public"

# Authentication & Security (generate 32+ character key for production)
JWT_SECRET="the_bombay_reserve_super_secret_jwt_key_2026_secure"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

### Client (`client/.env`):
```bash
VITE_API_BASE_URL="http://localhost:4000/api/v1"
```

> [!CAUTION]
> Never commit actual `.env` files. Both `server/.env` and `client/.env` are strictly blocked by `.gitignore`.

---

## 3. Installation & Database Setup

```bash
# 1. Install all dependencies across monorepo workspaces
npm install

# 2. Generate Prisma Client
npm run prisma:generate --workspace=server

# 3. (Optional) Apply migrations and seed PostgreSQL
npm run prisma:migrate --workspace=server
npm run prisma:seed --workspace=server
```

---

## 4. Running the Platform

### Option A: Simultaneous Development Mode
```bash
# Start backend API (Port 4000)
npm run dev:server

# In another terminal, start frontend (Port 5173)
npm run dev:client
```
- Client runs on: `http://localhost:5173`
- Backend API runs on: `http://localhost:4000/api/v1`
- Health check: `http://localhost:4000/api/health`

### Option B: Production Build & Run
```bash
# Build both client and server
npm run build

# Start server
npm run start --workspace=server
```

---

## 5. Running the Automated Test Suites

```bash
# Run tests across all workspaces
npm test

# Run tests in server only (API, auth, bookings, error handler)
npm run test --workspace=server

# Run tests in client only (components, navigation, forms)
npm run test --workspace=client
```

---

## 6. Default Seed Credentials

For testing and demonstration, the following accounts are pre-seeded:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Front-Desk Staff** | `staff@bombayreserve.com` | `Password@123` | Front-desk operations, arrivals, departures, check-in, check-out, occupancy grid, enquiries triage. |
| **General Manager (Admin)** | `admin@bombayreserve.com` | `Password@123` | Full access across all staff and administrative endpoints. |
| **Guest Member** | `guest@example.com` | `Password@123` | Guest portal, booking history, personal reservation cancellation. |
