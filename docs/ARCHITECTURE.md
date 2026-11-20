# System Architecture: The Bombay Reserve Full-Stack Platform

## 1. Architectural Philosophy

**The Bombay Reserve** is designed as a modular, resilient TypeScript monorepo providing dual experiences:
1. **Public & Guest Portal**: Boutique hotel and neighborhood discovery, date availability calculations, seamless booking flow with confirmation vouchers, reservation tracking, and bespoke event inquiries.
2. **Front-Desk & Staff Operations Portal**: Real-time arrival/departure management, one-click guest check-in and check-out, room inventory occupancy calendar, quick search by reservation reference or guest details, and event inquiry triage.

```
                           ┌───────────────────────────────┐
                           │      Browser / Client App     │
                           │    (React 18 + Vite + TS)     │
                           │   Guest Portal & Staff Desk   │
                           └───────────────┬───────────────┘
                                           │ JSON / REST
                                           ▼
                           ┌───────────────────────────────┐
                           │      Express Backend API      │
                           │   - Helmet / CORS / JSON      │
                           │   - Pino Structured Logger    │
                           │   - Zod Request Validators    │
                           │   - JWT Auth & RBAC Guard     │
                           └───────────────┬───────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       ┌───────────────────────────────┐             ┌───────────────────────────────┐
       │     PostgreSQL + Prisma       │             │   In-Memory Seed DataStore    │
       │    Production & Staging       │             │   Local Preview & Fast CI     │
       └───────────────────────────────┘             └───────────────────────────────┘
```

---

## 2. Monorepo Organization

```
/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI matrix
├── client/                      # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── api/                 # Typed fetch client with standardized error handling
│   │   ├── components/          # Navbar, Footer, BookingModal, AuthModal
│   │   ├── context/             # AuthContext (JWT session & user profile)
│   │   ├── pages/               # Home, Properties, Detail, Manage, Enquiries, Staff
│   │   ├── types/               # Mirrored TypeScript contracts
│   │   └── App.tsx              # React Router v6 setup
│   └── package.json
├── server/                      # Node.js + Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL entity relational models
│   │   └── seed.ts              # Seeding 14 Mumbai properties, rooms, staff
│   ├── src/
│   │   ├── config/              # Zod-validated environment variables
│   │   ├── data/                # Authentic Mumbai boutique hotel catalog
│   │   ├── errors/              # Typed AppError, NotFoundError, ValidationError, etc.
│   │   ├── lib/                 # Pino logger, audit loggers, Prisma client
│   │   ├── middleware/          # errorHandler, validateBody/Query, auth, RBAC
│   │   ├── repositories/        # dataStore repository adapter
│   │   ├── routes/              # auth, properties, bookings, staff, enquiries
│   │   ├── schemas/             # Zod input schemas
│   │   └── services/            # Business logic and availability calculation
│   └── package.json
├── docs/                        # Complete technical and operational specifications
├── .env.example                 # Root environment template
└── package.json                 # Workspaces definition & root scripts
```

---

## 3. Standing Architectural Invariants

### A. Standardized API Error Contract
Every failure response from the API strictly conforms to the JSON contract:
```json
{
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human-readable description of error",
    "details": {}
  }
}
```
Standard Error Codes:
- `VALIDATION_ERROR`: Zod schema constraint failure (includes field-level details array).
- `UNAUTHORIZED`: Missing or invalid Bearer JWT token.
- `FORBIDDEN`: User lacks role required for endpoint (e.g. Guest attempting Staff routes).
- `NOT_FOUND`: Resource (property slug, booking code, enquiry ID) does not exist.
- `CONFLICT`: Resource duplicate (e.g., duplicate email) or impossible state (e.g., double booking).
- `MALFORMED_JSON`: Invalid body format.
- `INTERNAL_SERVER_ERROR`: Unhandled exception.

### B. Structured Logging with Pino
- JSON logging with ISO timestamps.
- Automated sensitive field redaction: `req.headers.authorization`, `password`, `token`, `cookie`.
- Dedicated operational audit event streams:
  - `auth.login`, `auth.failed`, `auth.register`
  - `booking.created`, `booking.checked_in`, `booking.checked_out`, `booking.cancelled`
  - `enquiry.created`, `enquiry.status_updated`
  - `system.error` with stack trace

### C. Zero Hardcoded Secrets
- All secrets, ports, keys, and database URLs are loaded from environment variables.
- Zod parses `process.env` at server initialization. Any missing configuration causes an immediate startup crash with an explanatory message.
- `.env` files are strictly gitignored. Only `.env.example` templates are tracked.
