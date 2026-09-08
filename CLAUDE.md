# Rural Healthcare Coordination Platform

## Project

Rural healthcare coordination platform connecting ASHA workers, PHCs, doctors, hospitals, ambulance staff and facility administrators.

The complete requirements are in:

`docs/SRS/SRS.md`

Do not reproduce or reinterpret the entire SRS unless specifically required.

## Architecture

MVP architecture:

React Native Mobile
↓
REST / WebSocket
↓
NestJS Modular Monolith
↓
PostgreSQL + Prisma
↓
Redis + BullMQ

Offline:

Mobile / Raspberry Pi
↓
Local SQLite/cache
↓
Synchronization
↓
Cloud Backend

The Raspberry Pi is an edge node, NOT the primary backend.

## Technology

Backend:

* TypeScript
* NestJS
* PostgreSQL
* Prisma
* Redis
* BullMQ
* Socket.IO/WebSockets
* JWT
* Swagger/OpenAPI
* Jest
* Supertest

Package manager:

pnpm

## Backend modules

apps/api/src/

auth/
users/
facilities/
doctors/
appointments/
referrals/
availability/
inventory/
prescriptions/
health-records/
ambulance/
notifications/
sync/
audit/

common/
config/

## Architecture rules

1. Use a modular monolith.
2. Do not introduce microservices unless explicitly requested.
3. PostgreSQL is the authoritative cloud data store.
4. Use Prisma migrations for schema changes.
5. Enforce authorization server-side.
6. Never trust frontend validation for security.
7. Critical state transitions must be transactional.
8. Never use in-memory timers for critical business workflows.
9. Use BullMQ for persistent scheduled jobs.
10. Never expose sensitive health information in logs.
11. Never commit secrets.
12. Do not duplicate existing entities or services.
13. Reuse existing modules before creating new abstractions.
14. Prefer simple deterministic solutions over unnecessary AI.
15. Do not change public API contracts without checking existing consumers.

## Critical business rules

### Appointment concurrency

The same doctor/time slot cannot be successfully booked twice.

Use PostgreSQL transaction + appropriate uniqueness/locking.

Frontend checks are NOT sufficient.

### Referral timeout

Default doctor response timeout:

30 minutes.

Use BullMQ.

If no response:

referral → expired/pending-reassignment

and notify the referring user.

### Stale data

Facility data must contain:

`lastUpdatedAt`

Data older than the configured threshold must be marked stale.

Never present stale data as real-time.

### Healthcare records

ABHA is optional.

A patient must not be denied onboarding/referral because they do not have ABHA.

External ABDM functionality must use an adapter/provider architecture.

### Medicine alternatives

The system may display controlled alternative/equivalence data.

It must NOT autonomously prescribe medication.

## Code standards

Use:

* strict TypeScript
* DTO validation
* meaningful names
* small services
* clear module boundaries
* unit tests for business rules
* integration tests for critical database behavior
* Swagger documentation for public APIs

Avoid:

* unnecessary abstractions
* speculative features
* duplicate utilities
* premature optimization
* microservices
* AI where deterministic logic is sufficient

## Git rules

Branches:

`main` → stable releases

`develop` → integration branch

`feature/<name>` → individual work

Never directly commit feature work to `main`.

Keep commits small and descriptive.

## Agent behavior

Before changing code:

1. Inspect the existing implementation.
2. Identify affected modules.
3. Reuse existing code where possible.
4. Make the smallest change that satisfies the task.
5. Run relevant tests.
6. Run type-check/build when appropriate.
7. Report only what changed, tests run, and remaining issues.

Do NOT refactor unrelated code.

Do NOT modify another developer's module unless the task explicitly requires it.

If a requirement is ambiguous, inspect the SRS and existing architecture first. If still ambiguous, state the assumption before implementing.

## Current developer

You are working as Developer 1.

Primary ownership:

* repository architecture
* backend foundation
* authentication
* RBAC
* users
* facilities
* doctors
* schedules
* referrals
* appointments
* concurrency handling
* referral timeout
* audit foundation

Other ownership:

Developer 2:

* beds
* equipment
* medicine inventory
* Excel import
* prescription availability
* controlled medicine alternatives
* freshness/escalation

Developer 3:

* offline synchronization
* Redis/BullMQ infrastructure
* WebSockets
* notifications
* Raspberry Pi
* ABDM adapter
* ambulance connectivity abstraction

Developer 4:

* React Native mobile application

Respect these ownership boundaries.

## Important

Do not implement future features unless the current task requires them.

Work task-by-task.

Do not generate large explanations before making the requested change.
