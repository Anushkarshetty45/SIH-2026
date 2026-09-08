# Rural Healthcare Coordination Platform

A digital platform connecting ASHA workers, PHC staff, doctors, hospitals, ambulance staff, and administrators across rural India.

## Prerequisites

- Node.js >= 20
- pnpm >= 8
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

## Installation

```bash
# Clone
git clone <repo-url>
cd rural-healthcare-platform

# Install all workspace dependencies
pnpm install
```

## Environment Setup

```bash
cp .env.example apps/api/.env
# Edit apps/api/.env — set JWT_SECRET and JWT_REFRESH_SECRET
```

## Docker (PostgreSQL + Redis)

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## Prisma

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations (development)
pnpm prisma:migrate

# Open Prisma Studio
pnpm --filter @rhcp/api prisma:studio
```

## API

```bash
# Development (hot reload)
pnpm dev

# Production build
pnpm build

# Start production build
pnpm --filter @rhcp/api start
```

API: http://localhost:3000  
Swagger: http://localhost:3000/api/v1/docs  
Health: http://localhost:3000/api/v1/health

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires running Docker services)
pnpm test:e2e

# Lint
pnpm lint

# Format
pnpm format
```

## Repository Structure

```
rural-healthcare-platform/
├── apps/
│   ├── api/          # NestJS backend (Developer 1)
│   ├── mobile/       # React Native (Developer 4)
│   └── edge-node/    # Raspberry Pi edge (Developer 3)
├── packages/
│   ├── shared-types/ # Shared TypeScript types
│   └── config/       # Shared configuration utilities
├── docs/
│   ├── SRS/          # System requirements
│   ├── architecture/ # Architecture docs
│   └── requirements/ # Additional requirements
├── .github/
│   └── workflows/    # GitHub Actions CI
├── docker-compose.yml
├── pnpm-workspace.yaml
└── .env.example
```

## Developer Ownership

| Developer | Ownership |
|-----------|-----------|
| **D1** | Repository architecture, backend foundation, auth, RBAC, users, facilities, doctors, referrals, appointments, concurrency, audit |
| **D2** | Beds, equipment, medicine inventory, Excel import, prescriptions, medicine alternatives, freshness/escalation |
| **D3** | Offline sync, Redis/BullMQ, WebSockets, notifications, Raspberry Pi, ABDM adapter, ambulance |
| **D4** | React Native mobile application |
# SIH-2026
