
# Rural Healthcare Coordination Platform (RHCP)

![NestJS](https://img.shields.io/badge/backend-NestJS-e0234e?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178c6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2d3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791?logo=postgresql&logoColor=white)
![pnpm](https://img.shields.io/badge/package%20manager-pnpm-F69220?logo=pnpm&logoColor=white)
![Smart India Hackathon](https://img.shields.io/badge/event-SIH%202026-ff6f00)

> A healthcare coordination platform for rural India — connecting ASHA workers, PHCs, doctors, patients, referrals, appointments, emergency transport, and medical resources into a single coordinated system. Built for **Smart India Hackathon 2026**.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Proposed Solution](#proposed-solution)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Core Domain Modules](#core-domain-modules)
- [Data Model Overview](#data-model-overview)
- [Authentication & Authorization](#authentication--authorization)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Development Workflow](#development-workflow)
- [Security](#security)
- [Feature Status](#feature-status)
- [Low-Bandwidth & Rural Connectivity](#low-bandwidth--rural-connectivity)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The **Rural Healthcare Coordination Platform (RHCP)** is a monorepo-based healthcare system designed for rural healthcare environments, where facilities are dispersed, connectivity is unreliable, and coordination between frontline workers and hospitals happens over phone calls and paper.

The platform provides a REST API (NestJS + PostgreSQL + Prisma) covering the full rural care workflow: patient registration and consent, facility and doctor directories, appointments and doctor availability, inter-facility referrals, bed/equipment/medicine availability, and ambulance-dispatched emergency transport — with audit logging for accountability.

The repository is structured as a pnpm monorepo with three application areas:

| App | Purpose |
|---|---|
| `apps/api` | NestJS backend — REST API, authentication, domain modules, Prisma/PostgreSQL, Swagger |
| `apps/edge-node` | Edge/synchronization layer for low-connectivity deployment (foundation — see [Feature Status](#feature-status)) |
| `apps/mobile` | Mobile client for field healthcare workers (foundation — see [Feature Status](#feature-status)) |

---

## Problem Statement

Rural healthcare in India suffers from a **coordination gap**, not just a resource gap:

- **Referrals break down** — ASHA workers and PHC staff refer patients to CHCs or district hospitals by phone or paper slips. There is no tracked referral lifecycle, so approvals time out silently and patients fall through the cracks.

- **No visibility of capacity** — referring staff don't know which facility has a free ICU bed, a working ventilator, an available specialist, or an ambulance. Patients are sent to facilities that cannot treat them.

- **Frontline workers are disconnected** — ASHA workers operate across villages with poor connectivity (often 2G), and existing systems assume always-on broadband.

- **Records and consent live on paper** — patient history, consent for data sharing, and medicine stock movements are untracked and unauditable.

---

## Proposed Solution

A single coordination layer that models the real rural healthcare hierarchy:

1. **Digitize the actors** — role-based accounts for ASHA workers, PHC staff, doctors, facility staff, hospital admins, and ambulance staff.

2. **Digitize the capacity** — live registries of facilities, beds (ICU/oxygen/ventilator…), equipment, medicine stock, and doctor schedules.

3. **Digitize the workflow** — referrals with a tracked lifecycle (`PENDING_DOCTOR_APPROVAL → APPROVED/REJECTED → COMPLETED`), appointments bound to real slots, and emergency transports bound to ambulances.

4. **Design for bad networks** — a monorepo that includes an `edge-node` app and a `SyncModule`, establishing an architectural direction for store-and-forward synchronization in low-connectivity conditions (see [Low-Bandwidth & Rural Connectivity](#low-bandwidth--rural-connectivity)).

5. **Make it accountable** — consent is a first-class entity, and audit logs capture who did what, when, and from where.

---

## Key Features

| Area | Capability |
|---|---|
| **Authentication** | JWT-based auth with access + refresh tokens, refresh-token rotation, hashed refresh-token storage, bcrypt password hashing |
| **User management** | Role-based identities (7 roles), account active/inactive status |
| **Facility management** | Facility registry with type (PHC / CHC / District Hospital / City Hospital / Private Clinic), geolocation, contact details, and assigned administrator |
| **Doctor management** | Doctor profiles with specialization and registration number, linked to users and facilities |
| **Availability & scheduling** | Weekly doctor schedules, bookable appointment slots |
| **Appointments** | Full appointment lifecycle (scheduled → confirmed → completed / cancelled / no-show), optionally linked to a referral |
| **Referrals** | Inter-facility referrals with urgency levels and a six-state lifecycle |
| **Bed availability** | Beds by category (General, ICU, Oxygen, Ventilator, Maternity, Pediatric) and status, with update tracking |
| **Equipment tracking** | Equipment quantity, availability, and operational status per facility |
| **Medicine & inventory** | Medicine reference data, stock levels, stock transactions (receipt / issue / adjustment / correction) |
| **Emergency transport** | Ambulance registry and emergency transport trips linked to patients and receiving facilities |
| **Consent management** | Explicit patient consent entity (pending / granted / revoked) with purpose and expiry |
| **Audit logging** | Actor, action, entity, metadata, IP address, and timestamp for accountability |
| **API documentation** | Interactive Swagger/OpenAPI UI with Bearer auth support, auto-generated from the code |
| **Input validation** | Global `ValidationPipe` — unknown properties rejected, payloads transformed |

---

## System Architecture

```mermaid
flowchart TD
    Mobile["Mobile / Client Apps"] --> API["NestJS API  (/api/v1)"]
    Edge["Edge Node"] <--> API
    API --> Auth["Authentication (JWT + Refresh Rotation)"]
    API --> Domain["Healthcare Domain Modules"]
    Domain --> DB[("PostgreSQL via Prisma")]
    Domain --> Redis[("Redis")]
    Domain --> Audit["Audit Logging"]
    Edge --> Sync["Synchronization"]
```

**Key architectural characteristics:**

- **Global API prefix** — all endpoints are served under `/api/v1`.

- **Global validation** — a single `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`, and implicit conversion applies to all incoming requests.

- **CORS** — enabled at the application level for client apps.

- **Swagger** — enabled in non-production environments at `/api/v1/docs`.

- **Environment-based configuration** — database, Redis, and JWT settings all come from environment variables.

- **Monorepo layout** — `apps/` (api, edge-node, mobile) and shared `packages/`, managed with pnpm workspaces.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend framework | NestJS (TypeScript) |
| Database | PostgreSQL |
| ORM / migrations | Prisma |
| Cache / infrastructure | Redis |
| Authentication | JWT (access + refresh), bcrypt (12 salt rounds) |
| API documentation | Swagger / OpenAPI |
| Validation | class-validator via global NestJS `ValidationPipe` |
| Testing | Jest |
| Code quality | ESLint, Prettier |
| Package management | pnpm (workspaces) |
| Local infrastructure | Docker Compose |

---

## Repository Structure

```text
SIH-2026/
├── apps/
│   ├── api/                      # NestJS backend
│   │   ├── prisma/               # Prisma schema & migrations
│   │   ├── src/
│   │   │   ├── ambulance/
│   │   │   ├── appointments/
│   │   │   ├── audit/
│   │   │   ├── auth/
│   │   │   ├── availability/
│   │   │   ├── beds/
│   │   │   ├── common/            # Prisma module & shared infrastructure
│   │   │   ├── config/
│   │   │   ├── doctors/
│   │   │   ├── equipment/
│   │   │   ├── facilities/
│   │   │   ├── freshness/
│   │   │   ├── health-records/
│   │   │   ├── inventory/
│   │   │   ├── medicines/
│   │   │   ├── notifications/
│   │   │   ├── patients/
│   │   │   ├── prescriptions/
│   │   │   ├── referrals/
│   │   │   ├── sync/
│   │   │   ├── users/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── test/                 # E2E tests
│   ├── edge-node/                # Edge / synchronization layer (foundation)
│   └── mobile/                   # Mobile client (foundation)
├── packages/                     # Shared monorepo packages
├── docs/                         # Project documentation
├── .github/                      # Repository configuration
├── docker-compose.yml            # Local development infrastructure
├── .env.example                 # Environment variable template

├── package.json                  # pnpm workspace root
├── pnpm-lock.yaml
└── README.md
```

---

## Core Domain Modules

The NestJS application registers the following modules:

| Module | Functional Area |
|---|---|
| **Auth** | Registration, login, token refresh, logout (JWT + bcrypt) |
| **Users** | Healthcare user accounts and role-based identities |
| **Patients** | Patient records with demographics, ABHA ID (optional), preferred language, and consent status |
| **Facilities** | Facility registry — type, status, address, geolocation, contacts, administrator |
| **Doctors** | Doctor profiles — specialization, registration number, facility links |
| **Availability** | Doctor schedules and appointment slots |
| **Appointments** | Appointment lifecycle and slot booking |
| **Referrals** | Inter-facility referral workflow with urgency and approval lifecycle |
| **Beds** | Bed capacity by category and availability status |
| **Equipment** | Equipment inventory and operational status per facility |
| **Medicines** | Medicine reference data (name, generic, form, strength, category, manufacturer) |
| **Inventory** | Medicine stock levels and stock transactions |
| **Prescriptions** | Prescription workflows |
| **Health Records** | Health-record capabilities **(foundational — see [Feature Status](#feature-status))** |
| **Ambulance** | Ambulance registry and emergency transport lifecycle |
| **Notifications** | Notification capabilities **(foundational — see [Feature Status](#feature-status))** |
| **Sync** | Synchronization APIs for the edge layer **(foundational)** |
| **Audit** | Audit logging for accountability |
| **Freshness** | Data-freshness tracking **(foundational)** |
| **Health** | Service health check |

> Implementation depth varies across modules. The **Swagger UI** (`/api/v1/docs`) is the authoritative source for currently exposed endpoints.

---

## Data Model Overview

The Prisma schema (at `apps/api/prisma`) models the rural healthcare domain. High-level entity groups:

| Group | Entities |
|---|---|
| **Identity & access** | `User` (with role and account status) |
| **Facilities & staff** | `Facility`, `Doctor`, `DoctorSchedule`, `AppointmentSlot` |
| **Patients & consent** | `Patient`, `Consent` |
| **Care coordination** | `Appointment`, `Referral` |
| **Emergency transport** | `Ambulance`, `EmergencyTransport` |
| **Medical resources** | `Bed`, `Equipment`, `Medicine`, `MedicineStock`, `StockTransaction` |
| **Accountability** | `AuditLog` |
| **Health records** | Health-record–related entities |

**Key relationships:**

- `User ↔ Doctor` — a doctor profile is linked to a user account
- `User ↔ Facility` — facility administration and patient registration
- `Patient ↔ Consent` — explicit, revocable consent per patient
- `Patient ↔ Referral / Appointment / EmergencyTransport` — the patient's care journey
- `Doctor ↔ Facility / Schedule / AppointmentSlot / Appointment` — scheduling and booking
- `Facility ↔ Doctors / Referrals / Appointments / Ambulances / Beds / Equipment / Medicine inventory`

- `Referral ↔ Appointment` — a referral can culminate in a booked appointment
- `Ambulance ↔ EmergencyTransport` — which vehicle is executing which trip

The schema also defines indexes and uniqueness constraints for important lookups (e.g., user email/phone, facility identity, doctor registration) and data integrity. See `apps/api/prisma/schema.prisma` for the full definition.

---

## Authentication & Authorization

### Authentication flow

Authentication is JWT-based with refresh-token rotation:

1. **Register** — the API checks for an existing email/phone, hashes the password with **bcrypt (12 salt rounds)**, creates the user, and returns safe user data (never the password hash).

2. **Login** — the user is found by email; inactive or nonexistent accounts are rejected; the password is verified with bcrypt; **access + refresh tokens** are issued.

3. **Refresh-token security** — only a **hash** of the refresh token is stored in the database. On refresh, the JWT is verified, the user looked up, and the supplied token is verified against the stored hash before new tokens are issued. The old hash is **replaced** (rotation).

4. **Logout** — the stored refresh-token hash is removed, invalidating the refresh flow.

### Token lifetimes (defaults, configurable via environment)

| Token | Default lifetime |
|---|---|
| Access token | 15 minutes |
| Refresh token | 7 days |

### User roles

| Role | Intended user |
|---|---|
| `ASHA_WORKER` | Community health worker — field-level patient registration and follow-up |
| `PHC_STAFF` | Primary Health Centre staff |
| `DOCTOR` | Clinicians — schedules, appointments, referral responses |
| `FACILITY_STAFF` | Facility operations — beds, equipment, inventory |
| `HOSPITAL_ADMIN` | Hospital-level administration |
| `AMBULANCE_STAFF` | Emergency transport operations |
| `SUPER_ADMIN` | Platform administration |

> Roles are defined in the Prisma schema and available to the authorization layer. Enforcement depth varies by module — treat Swagger-protected endpoints as the current source of truth.

---

## API Documentation

Interactive documentation is generated with Swagger/OpenAPI directly from the code.

- **Base URL (local):** `http://localhost:3000/api/v1`
- **Swagger UI:** `http://localhost:3000/api/v1/docs`
- **Authentication:** Bearer (JWT)

### Endpoint groups

Endpoints are grouped by controller/module:

| Group | Description |
|---|---|
| Authentication | Register, login, refresh, logout |
| Users | User management |
| Patients | Patient records |
| Facilities | Facility registry |
| Doctors | Doctor profiles |
| Availability | Schedules and slots |
| Appointments | Appointment lifecycle |
| Referrals | Referral workflow |
| Beds | Bed availability |
| Equipment | Equipment status |
| Medicines | Medicine reference data |
| Inventory | Stock management |
| Prescriptions | Prescriptions |
| Health Records | Health records |
| Ambulances | Ambulances & emergency transport |
| Notifications | Notifications |
| Sync | Synchronization |
| Audit | Audit logs |
| Freshness | Data freshness |
| Health | Service health |

> For exact, always-current route paths, parameters, and schemas, open the **Swagger UI** — it is generated from the live controllers and cannot drift from the implementation.

### Testing protected endpoints in Swagger

1. Start the API (see [Getting Started](#getting-started)).
2. Open `http://localhost:3000/api/v1/docs`.
3. Register or log in through the appropriate auth endpoint.
4. Copy the **access token** from the response.
5. Click the **Authorize** button (🔒) at the top of the Swagger UI.
6. Paste: `Bearer <ACCESS_TOKEN>`
7. Execute any protected endpoint.

> Never commit real tokens or secrets anywhere in the repository.

---

## Getting Started

> Commands below target the `apps/api` workspace. The authoritative list of npm scripts lives in `apps/api/package.json`.

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20+ recommended |
| pnpm | 9+ (`npm install -g pnpm` or `corepack enable`) |
| Docker | any recent version (for PostgreSQL + Redis) |
| Git | any recent version |

### 1. Clone

```bash
git clone https://github.com/ChetanDevv06/SIH-2026.git
cd SIH-2026
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Then fill in the values (never commit the real `.env` file):

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://USER:PASSWORD@localhost:5432/DATABASE` |
| `JWT_SECRET` | Yes | Secret used to sign access tokens | a strong, random string |
| `JWT_ACCESS_EXPIRATION` | No | Access-token lifetime (default `15m`) | `15m` |
| `JWT_REFRESH_SECRET` | Yes | Secret used to sign refresh tokens | a strong, random string |
| `JWT_REFRESH_EXPIRATION` | No | Refresh-token lifetime (default `7d`) | `7d` |
| `REDIS_URL` | Yes | Redis connection string | `redis://localhost:6379` |
| `PORT` | No | API port (default `3000`) | `3000` |

> `.env.example` is the up-to-date template — check it for any additional variables.

### 4. Start infrastructure

Using Docker Compose (PostgreSQL and Redis for local development):

```bash
docker compose up -d
```

Alternatively, run PostgreSQL and Redis manually and point `DATABASE_URL` / `REDIS_URL` in `.env` at your instances.

### 5. Apply database migrations

```bash
cd apps/api
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### 6. Start the API

```bash
cd apps/api
pnpm start:dev
```

The API starts on `http://localhost:3000`, serving all routes under `/api/v1`.

### 7. Open Swagger

Navigate to:
```
http://localhost:3000/api/v1/docs
```

---

## Testing

The API includes Jest-based unit tests (e.g., `auth.service.spec.ts`, `app.module.spec.ts`) and an `apps/api/test` directory for E2E tests.

Run from `apps/api`:

```bash
# Unit tests
pnpm test

# Test coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

---

## Development Workflow

```bash
# Lint
cd apps/api && pnpm lint

# Format
cd apps/api && pnpm format
```

General guidelines:

1. Create a feature branch from `main`.
2. Keep changes focused; follow the existing NestJS module structure.
3. Run lint and tests before opening a pull request.
4. Never commit `.env` files, tokens, or secrets.

---

## Security

### Implemented

- **bcrypt password hashing** (12 salt rounds) — plaintext passwords are never stored or returned
- **JWT access tokens** (short-lived, 15-minute default)
- **JWT refresh tokens** (7-day default), with only a **hash** stored in the database
- **Refresh-token rotation** — the stored hash is replaced on every refresh
- **Logout invalidation** — the refresh-token hash is removed on logout
- **Account active-state checks** at login
- **Global DTO validation** — unknown/non-whitelisted properties are rejected
- **Role-based user model** (7 defined roles)
- **Audit-logging data model** for accountability
- **Environment-based secrets** — all sensitive values come from environment variables
- **Safe user responses** — password hashes are excluded from API responses

### Not yet implemented

The following are **not** currently in place and should not be assumed: rate limiting, CSRF protection, WAF, MFA, encryption at rest, end-to-end encryption, HIPAA/ABDM compliance. See [Future Enhancements](#future-enhancements).

---

## Feature Status

### ✅ Implemented

- NestJS API with global `/api/v1` prefix, CORS, and global `ValidationPipe`
- JWT authentication: register, login, refresh (hashed + rotated), logout
- bcrypt password hashing (12 salt rounds)
- Role model with 7 roles defined in the Prisma schema
- Prisma schema covering the full healthcare domain (users, facilities, doctors, patients, consent, referrals, appointments, availability, beds, equipment, medicines, inventory, ambulances, emergency transport, audit logs, and related entities) with indexes and uniqueness constraints
- Swagger/OpenAPI with Bearer auth (non-production environments)
- Health check endpoint
- All 19 domain modules registered in the application
- Jest test setup with unit tests for core auth/app wiring
- Docker Compose for local infrastructure
- Redis configuration via environment

### 🚧 In Progress / Foundation

- **Domain modules** — all modules are registered, but implementation depth varies; the Swagger UI reflects the currently exposed endpoints
- **Edge node (`apps/edge-node`)** — the application area exists as the architectural foundation for the edge/synchronization layer
- **Mobile app (`apps/mobile`)** — the application area exists as the foundation for the field-worker client
- **SyncModule / FreshnessModule / NotificationsModule / HealthRecordsModule** — present as foundational modules; capabilities are still being built out

### 📋 Planned / Future

- Offline-first mobile workflows and store-and-forward synchronization
- Conflict resolution and retry queues
- 2G/low-bandwidth payload optimizations
- Advanced notification delivery channels
- Production deployment and hardening
- Advanced security measures (see [Future Enhancements](#future-enhancements))

---

## Low-Bandwidth & Rural Connectivity

Rural healthcare environments frequently operate on unreliable, low-bandwidth connections (often 2G). The architecture is **designed with this constraint in mind**:

- A dedicated **edge-node** application area and **SyncModule** establish the architectural direction for an edge/synchronization layer that can decouple field operations from a central, always-connected API.

- The monorepo separation (`api` / `edge-node` / `mobile`) is intentionally structured so synchronization logic can live at the edge rather than in each client.

> The platform is **architected for** low-connectivity deployment. It is not yet fully 2G-optimized, and offline-first workflows are not yet production-complete. See [Feature Status](#feature-status).

**Planned low-bandwidth optimizations** **(not yet implemented)**:

- Lightweight API payloads
- Response compression
- Request batching
- Offline-first mobile workflows
- Store-and-forward synchronization
- Retry queues
- Conflict resolution
- Local caching
- Reduced image/media transfer
- Network-aware synchronization
- Efficient pagination

---

## Deployment

Deployment is currently oriented toward local development:

- **Docker Compose** provisions the local infrastructure (PostgreSQL + Redis).
- **Swagger** is disabled when the application runs in production mode.
- Database schema changes are managed through **Prisma migrations** — run them as part of any deployment.

Production-grade deployment (CI/CD pipelines, containerized API deployment, secrets management, monitoring, scaling) is **planned** — see below. This repository currently exposes no live deployment URL.

---

## Future Enhancements

- Offline-first mobile app for ASHA workers with local data capture and background sync
- Full edge-node synchronization service (store-and-forward, retry queues, conflict resolution)
- Low-bandwidth optimizations: compression, batching, pagination, and reduced media transfer
- Real-time notifications (push/SMS) for referral approvals, appointment reminders, and emergency dispatch
- ABHA/ABDM integration for national health identity interoperability
- Advanced analytics dashboards for district/block health administrators
- Additional security hardening: rate limiting, MFA, encryption at rest
- Compliance evaluation (ABDM / HIPAA-aligned practices)
- Multi-language expansion beyond Marathi, Hindi, and English

---

## Contributing

Contributions are welcome.

1. Fork the repository: `https://github.com/ChetanDevv06/SIH-2026`
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes and run lint/tests
4. Open a pull request against `main`

Please do not commit secrets, tokens, or `.env` files.

---

## License

This project is proprietary software.

Copyright © 2026 ChetanDevv06. All rights reserved.

The repository is publicly available for project evaluation, judging,
review, and demonstration purposes. Public access does not grant
permission to copy, modify, redistribute, or reuse the source code,
architecture, implementation, or other original project materials.

Any reuse beyond permitted evaluation or review requires prior written
permission from the copyright holder.
```
