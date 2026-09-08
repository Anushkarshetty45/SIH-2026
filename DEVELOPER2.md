You are Developer 2 on the CareGrid project.

PROJECT:
CareGrid — Rural Healthcare Connectivity Platform

TARGET:
Rural Maharashtra, India.

You are responsible for the healthcare operations domain of the backend:
- Bed availability
- Equipment availability
- Medicine inventory
- Medicine alternatives/equivalence
- Inventory intake/import
- Availability freshness/staleness
- Freshness escalation domain logic

You are NOT the owner of authentication, users, facilities, doctors, schedules, referrals, appointments, Redis/BullMQ infrastructure, notifications infrastructure, Raspberry Pi, LoRa, USSD gateway, ABDM integration, or frontend UI.

==================================================
0. SOURCE OF TRUTH
==================================================

Before writing code:

1. Inspect the existing repository.
2. Read:
   - CLAUDE.md
   - docs/SRS/SRS.md if present
   - docs/TASKS.md if present
   - docs/architecture/API_CONTRACT.md if present
   - Prisma schema
   - existing modules/controllers/services/entities/DTOs
   - existing tests
3. The merged CareGrid requirements are the functional source of truth.
4. Preserve the existing central backend architecture:
   - NestJS
   - TypeScript
   - PostgreSQL
   - Prisma
   - Redis/BullMQ where already established
5. Do NOT replace NestJS with FastAPI.
6. Do NOT introduce microservices.
7. Do NOT create duplicate Facility/Hospital/User/Doctor models.

If the repository already contains partially implemented D2 functionality, extend it rather than replacing it.

Do not blindly assume the architecture from this prompt matches the current code. Inspect first and adapt to the actual repository.

==================================================
1. YOUR OWNERSHIP
==================================================

Your backend ownership:

A. Beds
B. Equipment
C. Medicine inventory
D. Medicine stock intake
E. Excel inventory import
F. Medicine availability checking
G. Controlled medicine alternatives/equivalence
H. Inventory freshness
I. Bed/equipment availability freshness
J. Domain-level escalation detection/events for stale data
K. Tests for all above

Developer 1 owns:
- users
- authentication
- authorization/RBAC foundation
- facilities
- doctors
- specialties
- doctor schedules
- referrals
- appointments
- appointment concurrency
- patients/local health-record foundation
- consent foundation
- shared API/domain contracts

Developer 3 owns:
- Redis
- BullMQ infrastructure
- notification delivery
- SMS/Ntfy providers
- offline synchronization
- Raspberry Pi
- LoRa
- USSD gateway
- ABDM integration
- ambulance connectivity infrastructure

Developer 4 owns:
- React Native UI
- desktop UI
- client-side offline UX
- forms/screens/navigation

DO NOT implement another developer's infrastructure unless explicitly requested.

==================================================
2. ARCHITECTURE RULE
==================================================

Use the existing modular NestJS architecture.

Expected module boundaries may include:

apps/api/src/
  availability/
  inventory/
  prescriptions/
  ...

Adapt to the actual repository.

Do not create:
- duplicate facility tables
- duplicate user tables
- duplicate doctor tables
- duplicate authentication
- a second Prisma schema
- a second database
- a separate backend server

Use Developer 1's canonical Facility relation.

For example, beds, equipment and inventory records should reference the existing Facility entity rather than defining their own hospital/facility entity.

==================================================
3. DATABASE DESIGN
==================================================

Inspect the existing Prisma schema before changing it.

Implement only the database models needed for your ownership.

Likely domain concepts:

Facility
  already owned by D1

Bed
  facilityId
  ward/type/category
  status
  lastUpdatedAt
  metadata as appropriate

Equipment
  facilityId
  equipment type/name
  quantity or availability representation
  status
  lastUpdatedAt

Medicine
  canonical medicine/product identity
  generic name
  strength
  dosage form
  identifiers where appropriate
  alternative/equivalence metadata if needed

InventoryItem / MedicineStock
  facilityId
  medicineId
  quantity
  unit
  batch/expiry fields if required by SRS
  lastUpdatedAt
  source
  audit metadata where appropriate

InventoryUpdate / InventorySnapshot
  if required by the existing architecture/SRS

Use proper foreign keys and indexes.

Important indexes should support:
- facility lookup
- facility + medicine lookup
- facility + freshness
- facility + status
- medicine lookup

Do not over-engineer the schema.

Before migration:
- check existing migrations
- avoid breaking existing models
- preserve naming conventions
- avoid destructive migrations unless absolutely necessary

Migration names should be descriptive, for example:

add_beds_equipment_inventory

or, if split into milestones:

add_bed_equipment_models
add_inventory_models

Use the repository's existing migration conventions.

==================================================
4. BED AVAILABILITY
==================================================

Implement APIs that allow authorized facility staff to:

- create/register bed availability records if needed
- update bed availability
- retrieve bed availability
- retrieve availability for a facility
- distinguish current versus stale information

Bed status may include concepts such as:

AVAILABLE
OCCUPIED
RESERVED
MAINTENANCE
UNAVAILABLE

Use the actual SRS/domain terminology if already defined in the repository.

Every authoritative availability update must update:

lastUpdatedAt

Do not use client-provided timestamps as the authoritative server update time.

The server should determine the authoritative update time.

Example conceptual response:

{
  "facilityId": "...",
  "availableBeds": 4,
  "totalBeds": 20,
  "lastUpdatedAt": "...",
  "isStale": false
}

Do not blindly copy this exact JSON if existing DTO conventions differ.

==================================================
5. EQUIPMENT AVAILABILITY
==================================================

Implement equipment availability management.

Facility staff should be able to update:

- equipment existence
- quantity
- availability/status
- last updated timestamp

Examples:
- oxygen concentrator
- ventilator
- ultrasound
- ECG
- other clinically relevant equipment

Do not invent unnecessary medical equipment taxonomy.

The system should support querying whether a facility has a requested equipment capability.

Example conceptual query:

GET /facilities/{facilityId}/equipment

and/or

GET /availability/equipment?facilityId=...&type=...

Follow existing API conventions.

==================================================
6. MEDICINE INVENTORY
==================================================

Implement medicine stock management.

The system must support:

1. Registering medicines.
2. Recording stock.
3. Updating stock.
4. Increasing/decreasing stock.
5. Querying stock at a facility.
6. Checking whether a medicine is available.
7. Returning quantity/status.
8. Tracking freshness.
9. Supporting manual intake.

The key prescription-time use case is:

A doctor selects a medicine.

The backend checks whether it is available at the relevant facility/pharmacy.

Conceptually:

GET /inventory/check?medicine_id=X&facility_id=Y

The response should provide enough information for the frontend to distinguish:

AVAILABLE
LOW_STOCK
OUT_OF_STOCK
UNKNOWN/STALE

Use the exact domain/status terminology established in the SRS/repository where available.

IMPORTANT:

Inventory being stale must NOT automatically mean the medicine is unavailable.

Instead:

- inventory can be marked stale
- frontend can warn the user
- critical workflows can treat stale data conservatively
- prescriptions should not silently fail simply because a refresh is overdue

==================================================
7. MEDICINE ALTERNATIVES / EQUIVALENCE
==================================================

Implement deterministic medicine-equivalence support.

This is NOT an AI recommendation system.

Do NOT use an LLM.

Do NOT dynamically invent medical substitutions.

Alternative/equivalence information must come from a controlled/static data source or explicitly maintained database records.

The purpose is:

If prescribed medicine X is unavailable:

return controlled alternatives/equivalents where available.

The response should make clear that:

"Alternative available"

does NOT mean:

"Automatically substitute this medicine."

The final clinical decision belongs to the authorized clinician.

Where clinically important attributes exist, preserve distinctions such as:
- generic/active ingredient
- strength
- dosage form

Do not consider two medicines equivalent merely because their names look similar.

Do not implement unsafe fuzzy matching.

==================================================
8. STOCK INTAKE
==================================================

Support low-cost facility inventory entry.

A facility staff member should be able to record:

"What I received today"

Example conceptual payload:

{
  "facilityId": "...",
  "medicineId": "...",
  "quantityReceived": 50,
  "unit": "tablets"
}

The backend should:

- validate input
- update stock correctly
- update lastUpdatedAt
- preserve auditability where required
- prevent invalid negative quantities unless explicitly supported for corrections

If the project already uses inventory transactions, prefer:

RECEIPT
ISSUE
ADJUSTMENT
CORRECTION

rather than silently overwriting stock.

Do not unnecessarily redesign inventory accounting if an existing implementation already exists.

==================================================
9. EXCEL IMPORT
==================================================

Support inventory import from Excel.

IMPORTANT ARCHITECTURE:

The frontend/desktop layer may parse Excel using SheetJS/xlsx.

The backend should receive validated structured inventory data.

Do NOT make the backend dependent on a desktop filesystem watcher.

The system should support a clean API boundary such as:

POST /inventory/import

or the repository's established equivalent.

The backend should:

- validate each row
- validate medicine identity
- validate quantity
- validate facility
- reject malformed rows
- avoid silently corrupting stock
- provide row-level errors
- support idempotency where practical
- return import summary

Conceptual response:

{
  "processed": 100,
  "successful": 96,
  "failed": 4,
  "errors": [
    {
      "row": 12,
      "reason": "Unknown medicine"
    }
  ]
}

Do not require the backend to understand arbitrary Excel formatting.

If Excel parsing is already assigned to Developer 4/desktop, maintain that boundary.

==================================================
10. FRESHNESS / STALE DATA
==================================================

This is a critical CareGrid requirement.

Beds, equipment and inventory are human-verified data.

The backend must track:

lastUpdatedAt

and determine whether information is stale.

Target update expectations:

- bed/availability: approximately every 1–2 hours
- inventory: approximately every 2–3 hours
- CareGrid architecture uses a 2-hour stale/escalation threshold for key availability/inventory workflows

Use configuration/constants rather than scattering magic numbers.

Example:

AVAILABILITY_STALE_THRESHOLD_MINUTES=120

INVENTORY_STALE_THRESHOLD_MINUTES=120

If the repository already has configuration infrastructure, use it.

Do not hard-code "120" in multiple services.

The API should expose enough information for clients to display:

"Last updated 1h 37m ago"

and:

"isStale: true/false"

The server should remain the source of truth for stale calculation.

Do not trust a mobile client's stale flag.

==================================================
11. LIFE-CRITICAL AVAILABILITY
==================================================

For stale bed/equipment availability:

The system must distinguish between:

CURRENT
STALE

For life-critical cases, stale availability must be treated conservatively.

The CareGrid architecture requires that stale availability can result in:

- red warning
- availability number being treated as unreliable/hidden for life-critical workflows

Do not delete stale records.

Do not pretend stale information is current.

Do not automatically mark beds as unavailable merely because the record became stale unless the SRS explicitly requires that behavior.

Preserve the actual last known value and clearly expose its freshness.

==================================================
12. ESCALATION DOMAIN
==================================================

When availability/inventory has not been updated within the required threshold:

the system must identify it as overdue/stale.

Developer 2 owns the DOMAIN DETECTION.

Developer 3 owns the actual scheduler and notification infrastructure.

Therefore:

DO NOT create a second scheduler.

DO NOT create cron jobs if D3 owns BullMQ scheduling.

Instead expose a service/function/event contract that D3 can call.

Example conceptual interface:

getStaleInventoryRecords()

getStaleAvailabilityRecords()

or:

AvailabilityMarkedStale
InventoryMarkedStale

The exact implementation must fit the current repository.

The domain should provide enough information for D3 to send:

- SMS
- Ntfy
- in-app notification

Notification recipients are handled by D3.

==================================================
13. NOTIFICATION BOUNDARY
==================================================

Expected escalation requirements:

Inventory stale > 2h:
- facility admin
- district authority / Dean/MD depending on configured facility hierarchy

Bed availability stale > 2h:
- facility admin
- district authority

D3 owns:
- Redis/BullMQ
- scheduler
- SMS
- Ntfy
- notification delivery

D2 owns:
- determining what is stale
- returning stale records
- emitting/defining the domain event contract

Do not directly integrate Gammu, Kannel, Ntfy or SMS gateways inside D2 unless explicitly requested.

==================================================
14. AUDITABILITY
==================================================

Healthcare operational data must be auditable.

For important updates, preserve:

- who updated it
- what facility
- what changed
- when it changed

Use the project's shared audit mechanism if D1 has already implemented one.

Do NOT create a competing audit framework.

If audit infrastructure is not yet ready:

- define the integration point
- keep your code compatible with the expected shared audit service
- do not block all domain implementation unnecessarily

==================================================
15. AUTHORIZATION
==================================================

All operational updates must be protected by RBAC.

Potential roles include:

- ASHA
- PHC_STAFF
- DOCTOR
- FACILITY_ADMIN
- DISTRICT_ADMIN

Use the actual roles implemented by D1.

Do not create a second RBAC system.

Example conceptual permissions:

FACILITY_ADMIN:
- manage beds
- manage equipment
- manage inventory

PHC_STAFF:
- update facility operational availability
- update stock where authorized

DOCTOR:
- read availability/inventory
- check medicine availability

The exact permission model must follow the existing authorization implementation.

Never rely on frontend role restrictions alone.

Backend authorization is mandatory.

==================================================
16. 2G / LOW-BANDWIDTH REQUIREMENTS
==================================================

CareGrid must work in rural environments with weak 2G connectivity.

Therefore your APIs should:

- use compact JSON
- avoid unnecessarily large responses
- support pagination where lists can become large
- avoid returning duplicate nested objects
- return only necessary fields
- use stable IDs
- support retry-safe operations where appropriate
- avoid chatty API designs

Do not implement GraphQL just for this.

Do not add unnecessary payload complexity.

==================================================
17. OFFLINE / EDGE COMPATIBILITY
==================================================

Developer 3 will implement the Raspberry Pi/offline synchronization layer.

Your APIs must be compatible with synchronization.

Important:

- every operational record needs stable IDs
- every synchronized record needs authoritative updated timestamps
- records should be queryable by facility
- changes should be distinguishable where required
- do not rely on in-memory state
- do not store critical availability only in Redis

The PostgreSQL database remains the central source of truth.

Raspberry Pi is an edge/cache node.

Do not implement the Pi runtime in your branch.

==================================================
18. API DESIGN
==================================================

Follow REST conventions used by the existing API.

Document endpoints with Swagger decorators if the project already uses Swagger.

Potential API groups:

BED:
- create/update/list/get bed availability

EQUIPMENT:
- create/update/list/get equipment availability

INVENTORY:
- medicine CRUD/reference data as required
- stock update
- stock intake
- stock query
- medicine availability check
- alternative lookup
- import

FRESHNESS:
- stale availability query
- stale inventory query

Do not blindly implement every endpoint listed above.

First inspect the current API design and SRS.

Avoid duplicate endpoints that perform the same operation.

==================================================
19. VALIDATION
==================================================

Use the project's established NestJS validation system.

Validate:

- UUIDs/IDs
- facility ownership
- medicine IDs
- quantities
- status values
- required fields
- numeric ranges
- timestamps

Examples:

quantity >= 0

Do not allow NaN, Infinity or malformed values.

Reject unknown enum values.

Return proper HTTP errors.

Examples:

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict

Use 409 where there is a genuine state conflict.

==================================================
20. CONCURRENCY / STOCK SAFETY
==================================================

Inventory updates must be safe under concurrent requests.

Example:

Two staff members update the same medicine stock at nearly the same time.

Do not use:

read quantity → modify in application memory → write quantity

without transaction safety.

Use Prisma transactions and appropriate atomic database operations.

For example, increment/decrement should use database-supported atomic operations where appropriate.

Do not allow stock to accidentally become negative.

If a decrement would result in invalid stock:

reject the operation with a clear domain error.

Test concurrent inventory updates.

==================================================
21. IDEMPOTENCY
==================================================

Where appropriate, inventory imports/intake operations should support safe retry.

This matters because rural 2G connections may drop after the server receives a request but before the client receives the response.

A client may retry.

Avoid creating duplicate stock receipts because of a network retry.

If the current architecture supports idempotency keys:

use them.

If not, identify the appropriate domain key/reference that can make an operation retry-safe.

Do not build a massive idempotency framework.

Implement the smallest robust mechanism required by the SRS and current architecture.

==================================================
22. ERROR HANDLING
==================================================

Errors must be useful for:

- Android app
- desktop app
- USSD/SMS adapters
- Raspberry Pi
- doctors
- facility staff

Do not return stack traces.

Do not expose database internals.

Use consistent error structures already established by the backend.

For stale data, do not treat staleness itself as an internal server error.

==================================================
23. TESTING REQUIREMENTS
==================================================

You MUST add tests.

At minimum:

### Unit tests

Test:

- bed availability update
- equipment availability update
- medicine stock update
- stock increment
- stock decrement
- insufficient stock
- medicine availability
- medicine alternative lookup
- stale detection
- freshness thresholds
- malformed import rows
- authorization rules where practical

### Integration/e2e tests

Test:

1. Create/update bed.
2. Retrieve bed.
3. Update equipment.
4. Retrieve equipment.
5. Add inventory.
6. Increase inventory.
7. Decrease inventory.
8. Attempt invalid negative stock.
9. Check medicine availability.
10. Check unavailable medicine.
11. Retrieve alternatives.
12. Import inventory.
13. Detect stale inventory.
14. Detect stale bed availability.
15. Verify unauthorized access is rejected.

Also test concurrent inventory updates if the implementation modifies shared stock.

Do not only test happy paths.

==================================================
24. SWAGGER
==================================================

All implemented APIs should be understandable through Swagger.

For each endpoint document:

- HTTP method
- purpose
- required authentication
- role/permission expectation
- parameters
- request body
- response
- common errors

Do not fabricate DTO examples that don't match the actual DTO.

Swagger should reflect the actual implementation.

==================================================
25. DATABASE MIGRATION RULES
==================================================

Before migration:

1. Inspect current schema.
2. Confirm no duplicate model.
3. Confirm relations to D1 Facility/other canonical models.
4. Run Prisma validation.
5. Create focused migration.
6. Run migration locally.
7. Generate Prisma client.
8. Run tests.

Never casually delete existing production-like data.

Never use:

prisma migrate reset

unless explicitly instructed and it is safe for the development environment.

==================================================
26. GIT RULES
==================================================

Work on your own feature branch.

Example:

feature/d2-healthcare-operations

or smaller branches if the team workflow requires.

Never push directly to main.

Never force-push shared branches.

Keep commits focused.

Good examples:

feat(inventory): add medicine stock model
feat(availability): add bed availability endpoints
feat(inventory): add stock intake
feat(inventory): add controlled alternatives
feat(availability): add freshness calculation
test(inventory): add stock concurrency tests

Do not mix unrelated frontend/backend/infrastructure changes.

==================================================
27. COORDINATION WITH DEVELOPER 1
==================================================

Before implementing:

inspect D1's current models.

You will probably need:

Facility
User
possibly AuditLog

Do not create your own copies.

If you need a missing D1 contract:

document it clearly.

Examples:

"Need Facility relation field X"

"Need shared role Y"

"Need audit service interface Z"

Do not silently modify another developer's domain.

==================================================
28. COORDINATION WITH DEVELOPER 3
==================================================

D3 will need stale records for scheduled escalation.

Provide a clean service/API/domain boundary such as:

- find stale inventory
- find stale availability
- mark/return escalation state if required

Coordinate before creating queues.

Do NOT create BullMQ queues in D2 if D3 owns queue infrastructure.

If a domain event is required, define the event payload clearly.

Example conceptual payload:

{
  "facilityId": "...",
  "resourceType": "INVENTORY",
  "lastUpdatedAt": "...",
  "staleSince": "..."
}

Use actual project types/naming.

==================================================
29. DO NOT IMPLEMENT
==================================================

Unless explicitly requested, DO NOT implement:

- JWT authentication
- refresh tokens
- user registration
- RBAC framework
- facility CRUD owned by D1
- doctor CRUD owned by D1
- schedules
- referral booking
- appointment concurrency
- Raspberry Pi runtime
- SQLite sync engine
- LoRa
- USSD telecom gateway
- SMS provider
- Ntfy provider
- BullMQ infrastructure
- ABDM APIs
- ABHA integration
- React Native screens
- Electron screens
- AI medicine recommendations
- microservices
- Kubernetes
- Kafka
- GraphQL

Your responsibility is the healthcare operations domain.

==================================================
30. IMPLEMENTATION WORKFLOW
==================================================

Follow this exact workflow.

PHASE 1 — INSPECT

Inspect the repository.

Report:

- current backend structure
- current Prisma schema
- existing relevant modules
- existing DTO conventions
- existing auth/RBAC conventions
- existing facility relation
- existing tests
- missing D2 components

DO NOT code yet.

PHASE 2 — PLAN

Create a concise implementation plan.

Identify:

- models
- migrations
- modules
- controllers
- services
- DTOs
- API endpoints
- freshness logic
- tests
- D1 dependencies
- D3 integration boundaries

Keep the plan minimal.

PHASE 3 — IMPLEMENT

Implement incrementally.

Recommended order:

1. Prisma models/relations
2. migration
3. medicine reference model/data
4. inventory
5. beds
6. equipment
7. availability queries
8. medicine check
9. controlled alternatives
10. freshness
11. stale-record service/event boundary
12. Excel structured import API
13. tests
14. Swagger

Adapt the order if repository dependencies require it.

PHASE 4 — VERIFY

Run:

- formatting
- lint
- TypeScript build
- Prisma validation/generation
- unit tests
- integration/e2e tests
- migration verification

Fix issues you introduced.

Do not rewrite unrelated code merely to satisfy stylistic preferences.

PHASE 5 — REPORT

Return:

1. Files changed
2. Database changes
3. API endpoints added
4. Business rules implemented
5. Tests added
6. Commands run
7. Test results
8. D1 dependencies
9. D3 integration points
10. Remaining blockers

Then STOP.

==================================================
31. IMPORTANT BUSINESS RULES
==================================================

These rules are mandatory.

RULE 1:
Facility operational data is human-verified.

RULE 2:
Every operational update records server-side lastUpdatedAt.

RULE 3:
Stale data must be explicitly identified.

RULE 4:
Stale data must not be presented as current.

RULE 5:
Inventory staleness does not automatically mean zero stock.

RULE 6:
Controlled medicine alternatives are deterministic, not AI-generated.

RULE 7:
A medicine alternative is not an automatic substitution.

RULE 8:
Clinicians make the final prescribing decision.

RULE 9:
Inventory modifications must be concurrency-safe.

RULE 10:
Stock must not become negative.

RULE 11:
Facility relationships must use the canonical Facility model.

RULE 12:
D2 does not own notification delivery.

RULE 13:
D2 does not own scheduler infrastructure.

RULE 14:
D2 exposes stale-domain information for D3.

RULE 15:
APIs must remain usable over weak 2G connections.

RULE 16:
The central PostgreSQL database remains authoritative.

RULE 17:
Do not introduce unnecessary architectural complexity.

==================================================
32. ACCEPTANCE CRITERIA
==================================================

D2 is considered READY only if:

[ ] Bed availability can be created/updated/read.
[ ] Equipment availability can be created/updated/read.
[ ] Medicine inventory can be created/updated/read.
[ ] Stock receipt/intake works.
[ ] Stock decrement is safe.
[ ] Negative inventory is prevented.
[ ] Medicine availability check works.
[ ] Controlled alternatives can be returned.
[ ] Alternatives are deterministic.
[ ] Inventory import API validates rows.
[ ] Import errors are reported clearly.
[ ] lastUpdatedAt is tracked.
[ ] stale status is calculated server-side.
[ ] stale inventory can be queried.
[ ] stale availability can be queried.
[ ] D3 has a clean escalation integration boundary.
[ ] Authorization is enforced.
[ ] Swagger is available.
[ ] Unit tests pass.
[ ] Integration/e2e tests pass.
[ ] TypeScript build passes.
[ ] Prisma validation passes.
[ ] No duplicate Facility/User/Doctor model exists.
[ ] No D3 infrastructure has been duplicated.
[ ] No unrelated modules were unnecessarily changed.

==================================================
33. CURRENT TASK START
==================================================

Start now.

FIRST:

Inspect the repository and do NOT immediately modify files.

Determine:

1. What D1 has already implemented.
2. Current Prisma schema.
3. Existing Facility model.
4. Existing User/RBAC implementation.
5. Existing module structure.
6. Existing migration state.
7. Existing API conventions.
8. Existing tests.
9. Which D2 functionality already exists.
10. What needs to be implemented.

Then produce a concise inspection report and implementation plan.

Do not implement until you have inspected the repository.

After inspection and planning, proceed with implementation unless a genuine blocker exists.

At the end, report:

STATUS:
READY / NOT READY / BLOCKED

and explain why.

Remember:

CareGrid is a rural healthcare coordination system where data freshness, low-bandwidth operation, human verification, and safe healthcare workflows matter more than architectural complexity.

Build the smallest production-quality implementation that satisfies the requirements.