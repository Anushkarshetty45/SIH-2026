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
