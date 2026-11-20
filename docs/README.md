# The Bombay Reserve - Platform Documentation

Welcome to the technical documentation for **The Bombay Reserve** Hotel Full-Stack Platform.

## Directory Structure
- [`/docs/ARCHITECTURE.md`](./ARCHITECTURE.md): Architectural layout, data flow, error contracts, and design decisions.
- [`/docs/API_SPEC.md`](./API_SPEC.md): Full OpenAPI-style endpoint and DTO specification.
- [`/docs/DATABASE_ERD.md`](./DATABASE_ERD.md): Database schema, relationships, and seed data catalog for the 14 Mumbai properties.
- [`/docs/DEPLOYMENT_RUNBOOK.md`](./DEPLOYMENT_RUNBOOK.md): Environment variables, deployment guides, and troubleshooting runbooks.

## Monorepo Layout
```
├── .github/workflows/    # CI automation workflows
├── client/               # React 18 + Vite + TypeScript + Tailwind CSS
├── server/               # Node + Express + TypeScript + Prisma + Pino
├── docs/                 # Platform specifications and guides
└── package.json          # Root workspace configuration
```
