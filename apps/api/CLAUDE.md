# Rural Healthcare Coordination Platform

## Project Overview

Backend API for a rural healthcare coordination platform connecting:
- ASHA workers
- PHC staff  
- Doctors
- District/city hospitals
- Hospital administrators
- Ambulance staff

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 + TypeScript (strict) |
| Framework | NestJS modular monolith |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis 7 + BullMQ |
| Auth | JWT (access + refresh) |
| API docs | Swagger/OpenAPI |
| Testing | Jest + Supertest |
| Package manager | pnpm workspaces |

## Architecture

```
React Native Mobile (D4)
        │ REST / WebSocket
        ▼
NestJS Modular Monolith  ←── This repo (backend)
        │
   ┌────┴────┐
PostgreSQL  Redis
 (Prisma)  (BullMQ)
```

Offline edge nodes (Raspberry Pi) sync through the `sync` module. The Pi is **not** the primary backend.

## Module Ownership

| Module | Developer |
|--------|-----------|
| auth, users, facilities, doctors, appointments, referrals, availability, audit | **D1** |
| inventory, prescriptions, health-records | **D2** |
| notifications, sync, ambulance | **D3** |
| mobile app (apps/mobile) | **D4** |

## Critical Business Rules

1. **Appointment concurrency**: DB transaction + unique constraint. Frontend checks are not sufficient.
2. **Referral timeout**: 30 minutes, enforced by BullMQ — never in-memory timers.
3. **Stale facility data**: `lastUpdatedAt` field required. Mark stale past configured threshold.
4. **ABHA/ABDM**: Optional. Never block onboarding/referral for missing ABHA. Use adapter pattern.
5. **Medicine alternatives**: May display alternatives. Must NOT autonomously prescribe.

## Coding Rules

- Strict TypeScript — no `any` without justification
- DTO validation with `class-validator` on all inputs
- Authorization enforced server-side — never trust frontend
- Prisma migrations for all schema changes
- BullMQ for all persistent scheduled work
- Never log sensitive health information
- Never commit secrets

## Git Workflow

```
main        — stable releases (no direct commits)
develop     — integration branch
feature/<n> — individual work → PR to develop
```

## Agent Boundaries

Before changing code:
1. Inspect existing implementation
2. Identify affected modules
3. Reuse existing code
4. Make the smallest change that satisfies the task
5. Run relevant tests
6. Report only what changed

Do NOT modify another developer's module unless the task explicitly requires it.

See `CLAUDE.md` at repo root for full rules.
