# API Contract Specification

Rural Healthcare Coordination Platform (CareGrid) core backend API contract.

## Base URL
- Local: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`

---

## Authentication & Authorization
All secured endpoints require Bearer JWT header:
`Authorization: Bearer <accessToken>`

### Roles
- `SUPER_ADMIN`
- `HOSPITAL_ADMIN`
- `DOCTOR`
- `FACILITY_STAFF`
- `PHC_STAFF`
- `ASHA_WORKER`
- `AMBULANCE_STAFF`

---

## 1. Auth Module (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register user account |
| `POST` | `/auth/login` | Public | Authenticate with email & password |
| `POST` | `/auth/refresh` | Public | Refresh expired access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token |

---

## 2. Users Module (`/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users/me` | Authenticated | Get current authenticated user profile |
| `PATCH` | `/users/me/language` | Authenticated | Update preferred language (MARATHI, HINDI, ENGLISH) |
| `PATCH` | `/users/me/profile` | Authenticated | Update user profile info |
| `GET` | `/users` | Admin | List users (paginated) |
| `GET` | `/users/:id` | Admin | Get user by ID |

---

## 3. Facilities Module (`/facilities`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/facilities` | Admin | Create healthcare facility |
| `GET` | `/facilities` | Authenticated | List facilities with district/type filters |
| `GET` | `/facilities/:id` | Authenticated | Get facility details |
| `PATCH` | `/facilities/:id` | Admin | Update facility details |
| `GET` | `/facilities/:id/availability` | Authenticated | Get facility availability + data freshness indicator |

---

## 4. Doctors Module (`/doctors`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/doctors` | Admin | Register doctor and link user account |
| `GET` | `/doctors` | Authenticated | List doctors with facility/specialization filters |
| `GET` | `/doctors/:id` | Authenticated | Get doctor details |
| `PATCH` | `/doctors/:id` | Doctor / Admin | Update doctor availability / profile |

---

## 5. Availability Module (`/availability`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/availability/schedules` | Doctor / Admin | Create weekly recurring schedule |
| `GET` | `/availability/schedules/:doctorId` | Authenticated | Get doctor's schedules |
| `POST` | `/availability/slots/generate` | Doctor / Admin | Idempotently generate slots from schedule |
| `GET` | `/availability/slots` | Authenticated | Query available appointment slots |
| `PATCH` | `/availability/slots/:id` | Doctor / Admin | Update slot status (AVAILABLE, BOOKED, BLOCKED) |

---

## 6. Patients Module (`/patients`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/patients` | ASHA / Staff / Doctor / Admin | Register patient (ABHA identifier is optional) |
| `GET` | `/patients` | Authenticated | Search patients by phone / name / ABHA |
| `GET` | `/patients/:id` | Authenticated | Get patient profile & consent status |
| `PATCH` | `/patients/:id` | Authenticated | Update patient details |
| `PATCH` | `/patients/:id/consent` | Staff / Doctor / Admin | Update patient consent (GRANTED / REVOKED) |

---

## 7. Referrals Module (`/referrals`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/referrals` | ASHA / Staff / Doctor / Admin | Create referral (triggers 30-min timeout queue) |
| `GET` | `/referrals` | Authenticated | List referrals with filters & pagination |
| `GET` | `/referrals/:id` | Authenticated | Get referral details & audit history |
| `PATCH` | `/referrals/:id/respond` | Doctor / Admin | Approve or Reject referral |
| `PATCH` | `/referrals/:id/cancel` | Authenticated | Cancel pending referral |

---

## 8. Appointments Module (`/appointments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/appointments` | Staff / Doctor / Admin | Concurrency-safe slot booking with pessimistic lock |
| `GET` | `/appointments` | Authenticated | List appointments |
| `GET` | `/appointments/:id` | Authenticated | Get appointment details |
| `PATCH` | `/appointments/:id/status` | Doctor / Staff / Admin | Update status (CONFIRMED, COMPLETED, NO_SHOW) |
| `PATCH` | `/appointments/:id/cancel` | Authenticated | Cancel appointment and free reserved slot |

---

## 9. Ambulance Module (`/ambulance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/ambulance` | Admin | Register ambulance vehicle |
| `GET` | `/ambulance` | Authenticated | List fleet ambulances |
| `GET` | `/ambulance/:id` | Authenticated | Get ambulance by ID |
| `PATCH` | `/ambulance/:id` | Admin / Ambulance Staff | Update ambulance status |
| `POST` | `/ambulance/dispatch` | Staff / Doctor / Admin | Dispatch emergency transport |
| `GET` | `/ambulance/transports/all` | Authenticated | List emergency transport runs |
| `GET` | `/ambulance/transports/:id` | Authenticated | Get emergency transport run details |
| `PATCH` | `/ambulance/transports/:id/status` | Staff / Ambulance Staff / Admin | Update transport status (EN_ROUTE, ARRIVED, COMPLETED) |

---

## 10. Sync Module (`/sync`) — 2G & Edge Node Synchronization
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/sync/pull` | Authenticated | Delta pull changes since timestamp (optimized for 2G) |
| `POST` | `/sync/push` | Authenticated | Idempotent batch push mutations from edge/mobile |

---

## 11. Audit Module (`/audit`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/audit` | Admin | List system audit trails |
| `GET` | `/audit/entity/:entity/:entityId` | Doctor / Admin | Get audit trail for specific record |

---

## 12. Beds Module (`/beds`, `/facilities/:facilityId/beds`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/beds` | Facility Staff / Admin | Register a new bed in facility |
| `POST` | `/beds/batch` | Facility Staff / Admin | Batch instantiate beds for a ward/category |
| `PATCH` | `/beds/:id` | Staff / Doctor / Admin | Update bed status (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, UNAVAILABLE) |
| `GET` | `/beds` | Authenticated | List beds with ward/category/status filters |
| `GET` | `/beds/stale` | Staff / Doctor / Admin | Query facilities with stale bed data (> 120m) for D3 escalation |
| `GET` | `/beds/emergency-availability` | Authenticated | Emergency bed availability (ICU/Oxygen/Ventilator) with conservative staleness warnings |
| `GET` | `/beds/:id` | Authenticated | Get bed details by ID |
| `GET` | `/facilities/:facilityId/beds` | Authenticated | Facility bed capacity summary by category + freshness status |

---

## 13. Equipment Module (`/equipment`, `/facilities/:facilityId/equipment`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/equipment` | Facility Staff / Admin | Register medical equipment at facility |
| `PATCH` | `/equipment/:id` | Facility Staff / Admin | Update operational status, total, and available quantities |
| `GET` | `/equipment` | Authenticated | List equipment with category/status filters |
| `GET` | `/equipment/stale` | Staff / Doctor / Admin | Query facilities with stale equipment data (> 120m) for D3 escalation |
| `GET` | `/equipment/:id` | Authenticated | Get equipment details by ID |
| `GET` | `/facilities/:facilityId/equipment` | Authenticated | Get all equipment for a facility including operational counts and freshness |

---

## 14. Medicine Catalog Module (`/medicines`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/medicines` | Staff / Admin | Register a medicine in master catalog |
| `GET` | `/medicines` | Authenticated | Search and list medicines with pagination & category filters |
| `GET` | `/medicines/:id` | Authenticated | Get medicine details and primary alternatives |
| `PATCH` | `/medicines/:id` | Staff / Admin | Update medicine catalog details |
| `POST` | `/medicines/:id/alternatives` | Staff / Admin | Register controlled deterministic alternative medicine link |
| `GET` | `/medicines/:id/alternatives` | Authenticated | Get controlled alternatives and deterministic generic equivalents (supports `?facilityId=...` for live stock) |
| `DELETE` | `/medicines/:id/alternatives/:altId` | Staff / Admin | Remove controlled alternative mapping |

---

## 15. Medicine Inventory Module (`/inventory`, `/facilities/:facilityId/inventory`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/inventory/intake` | Staff / Admin | Concurrency-safe stock intake/receipt with 2G `idempotencyKey` retry support |
| `POST` | `/inventory/adjust` | Staff / Admin | Concurrency-safe adjustment (ISSUE/decrement, RECEIPT/increment, or physical count sync) |
| `GET` | `/inventory/check` | Authenticated | Single medicine prescription-time check (`facilityId`, `medicineId`) with freshness & alternatives |
| `POST` | `/inventory/check-prescription` | Authenticated | Multi-item prescription check with fulfillment status and deterministic alternatives |
| `POST` | `/inventory/import` | Staff / Admin | Structured batch inventory import with row-level validation and 2G retry idempotency |
| `GET` | `/inventory/stale` | Staff / Admin | Domain escalation detection: Query stale inventories (> threshold) for D3 |
| `GET` | `/facilities/:facilityId/inventory` | Authenticated | Paginated inventory with summary stats and facility-wide freshness |
| `GET` | `/facilities/:facilityId/inventory/:medicineId` | Authenticated | Single medicine stock at facility with recent transaction history |

---

## 16. Prescriptions Module (`/prescriptions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/prescriptions/check-availability` | Authenticated | Prescription-time multi-item availability check delegating to Inventory domain |

---

## 17. Freshness & Escalation Module (`/freshness`) — D3 Integration Contract
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/freshness/facility/:facilityId` | Authenticated | Unified operational freshness profile across beds, equipment, and inventory with life-critical warnings |
| `GET` | `/freshness/stale-records` | Staff / Doctor / Admin | Filterable stale records across operational domains (`?resourceType=ALL\|BEDS\|EQUIPMENT\|INVENTORY`) |
| `GET` | `/freshness/escalations` | Staff / Doctor / Admin | Domain escalation batches for D3 (BullMQ/Scheduler/Notification worker), segmented into Tier 1 (Facility Admin) and Tier 2 (District Authority / Dean) |
| `POST` | `/freshness/trigger-events` | Admin | Explicitly emit domain escalation events to `NotificationsService` for D3 real-time listeners |



