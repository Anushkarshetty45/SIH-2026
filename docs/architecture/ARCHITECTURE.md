# Architecture — Rural Healthcare Coordination Platform

## Overview

Modular monolith backend serving a React Native mobile application and Raspberry Pi edge nodes.

## System Diagram

```
React Native Mobile (Developer 4)
        │
        │  REST / WebSocket
        ▼
┌─────────────────────────────────────┐
│   NestJS Modular Monolith (D1/D2/D3)│
│                                     │
│  auth │ users │ facilities │ doctors│
│  appointments │ referrals           │
│  inventory │ prescriptions         │
│  ambulance │ notifications          │
│  sync │ audit                       │
└─────────────┬──────────┬────────────┘
              │          │
         PostgreSQL    Redis
          (Prisma)    (BullMQ)
```

## Offline / Edge

```
Mobile App / Raspberry Pi (D3/D4)
        │
        │  Local cache / SQLite
        │
        │  Sync protocol
        ▼
   NestJS Backend (sync module)
```

The Raspberry Pi is an **edge node**, not a backend replacement.

## Module Ownership

| Module | Owner |
|--------|-------|
| auth | D1 |
| users | D1 |
| facilities | D1 |
| doctors | D1 |
| appointments | D1 |
| referrals | D1 |
| availability | D1 |
| audit | D1 |
| inventory | D2 |
| prescriptions | D2 |
| health-records | D2 |
| notifications | D3 |
| sync | D3 |
| ambulance | D3 |

## Key Design Decisions

- **Modular monolith**: Single deployable NestJS app with clear module boundaries. No microservices.
- **PostgreSQL is authoritative**: All critical state lives in PostgreSQL. Redis is used for caching and job queues only.
- **BullMQ for scheduled jobs**: Referral timeouts, notifications, and escalation use BullMQ — not in-memory timers.
- **Prisma for schema management**: All schema changes via Prisma migrations. No manual SQL schema changes.
- **ABHA/ABDM is optional**: Patients can onboard without ABHA. ABDM integration uses an adapter pattern (D3).
- **Offline sync**: Mobile and edge nodes sync through the `sync` module. The Raspberry Pi is an edge node only.
