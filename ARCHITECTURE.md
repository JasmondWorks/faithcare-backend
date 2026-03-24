# FaithCare Backend — Architecture Document

> **Stack:** NestJS v11 · MongoDB (Mongoose) · JWT · Vercel Serverless
> **Pattern:** Multi-tenant SaaS · Repository Pattern · Layered Architecture

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architectural Style](#2-architectural-style)
3. [Layer Architecture](#3-layer-architecture)
4. [Module Dependency Graph](#4-module-dependency-graph)
5. [Multi-Tenancy Architecture](#5-multi-tenancy-architecture)
6. [Identity & Access Control Architecture](#6-identity--access-control-architecture)
7. [Data Architecture](#7-data-architecture)
8. [Request Lifecycle](#8-request-lifecycle)
9. [Build & Deployment Architecture](#9-build--deployment-architecture)
10. [Key Design Decisions & Trade-offs](#10-key-design-decisions--trade-offs)
11. [Boundaries & Constraints](#11-boundaries--constraints)
12. [Scalability Considerations](#12-scalability-considerations)

---

## 1. System Overview

FaithCare is a **multi-tenant church management SaaS**. Each tenant is a church **Organization**. The platform serves two categories of users:

- **Church staff / admins** — manage first-timer follow-up, membership, prayer requests, and dashboards.
- **Church members** — use personal spiritual tools (journal, daily scripture, focus timer).

Additionally, **Prime Church** has a dedicated public-facing module that accepts form submissions (workforce applications, Trybe membership, prayer requests) with no authentication required — intended for embedding in public web pages.

### Top-Level Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          External Actors                        │
│                                                                 │
│  Church Staff/Admins    Church Members    Public Web Visitors   │
│  (authenticated)        (authenticated)   (unauthenticated)     │
└────────────┬────────────────────┬─────────────────┬────────────┘
             │                    │                 │
             │         HTTPS / REST API             │
             ▼                    ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel Edge / CDN                           │
│           All requests → /api/index  (lambda.ts)                │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              NestJS Application (ExpressAdapter v5)             │
│                                                                 │
│   Global Prefix: /api/v1          Docs: /api/v1/docs            │
│   Global Guards: JwtAuthGuard, RolesGuard                       │
│   Global Pipes:  ValidationPipe                                 │
│   Global Filter: GlobalErrorFilter                              │
└─────────────────────────────────┬───────────────────────────────┘
                                  │  Mongoose ODM
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                               │
│                    (faith-care database)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Style

### Layered Monolith (Modular)

FaithCare is a **modular monolith** — all modules are compiled and deployed as a single NestJS application, but are internally separated by clear module boundaries. This is intentional: the codebase is small enough that microservices would add operational overhead without benefit.

### Patterns in Use

| Pattern | Where | Why |
|---------|-------|-----|
| **Repository Pattern** | Every module has `*.repository.ts` | Decouples business logic from Mongoose/MongoDB specifics |
| **Service Layer** | Every module has `*.service.ts` | Encapsulates business rules above the repository |
| **DTO + Validation** | Every endpoint has `*.dto.ts` | Input validation at the boundary via `class-validator` |
| **Guard Chain** | `JwtAuthGuard → RolesGuard → TenantGuard` | Layered security checks separated by concern |
| **Decorator-driven metadata** | `@Public()`, `@Roles()`, `@CurrentUser()` | Declarative access control, no boilerplate in handlers |
| **Soft Delete** | All schemas extend `BaseSchema` | Data is never hard-deleted unless explicitly required |
| **Generic Base Classes** | `BaseRepository<T>`, `BaseService<T>` | CRUD logic written once, inherited by all modules |

---

## 3. Layer Architecture

Each module follows a strict vertical layer:

```
┌─────────────────────────────────────────┐
│             Controller Layer            │  ← HTTP in/out, DTO binding,
│          (*.controller.ts)              │    route decorators, guards
├─────────────────────────────────────────┤
│             Service Layer               │  ← Business logic, orchestration,
│           (*.service.ts)                │    cross-service calls, error throws
├─────────────────────────────────────────┤
│           Repository Layer              │  ← Mongoose model queries,
│         (*.repository.ts)               │    data access only, no business logic
├─────────────────────────────────────────┤
│             Schema Layer                │  ← Mongoose schema definitions,
│           (*.schema.ts)                 │    field types, indexes, defaults
└─────────────────────────────────────────┘
              ▼ via Mongoose ODM
┌─────────────────────────────────────────┐
│              MongoDB Atlas              │
└─────────────────────────────────────────┘
```

### Base Classes — Shared CRUD Foundation

All modules inherit from shared generics to eliminate CRUD repetition:

```
BaseRepository<T>              BaseService<T>
  ├── create(data)               ├── create(data)
  ├── findAll(filter?)           ├── findAll(filter?)
  ├── findOne(filter)            ├── findOne(filter)
  ├── findById(id)               ├── findById(id)
  ├── update(id, update)         ├── update(id, data)
  ├── delete(id)                 ├── delete(id)
  ├── softDelete(id)             └── softDelete(id)
  ├── restore(id)
  └── paginate(filter, opts)

Module repositories extend BaseRepository and add
domain-specific query methods (e.g. findByEmail,
findByOrganization, findByUserAndOrg).
```

---

## 4. Module Dependency Graph

Arrows represent import/injection dependencies.

```
AppModule
  │
  ├── ConfigModule (global)           ← env config
  ├── MongooseModule (global)         ← MongoDB connection
  │
  ├── HealthModule                    (standalone)
  │
  ├── UsersModule ◄────────────────── AuthModule
  │     └── provides: UsersService        │
  │                                       │ imports
  ├── OrganizationsModule ◄───────────────┘
  │     └── provides: MembershipService
  │              ▲
  │              │ injects TenantGuard
  │              │
  ├── FirstTimersModule               (uses organizationId query param)
  ├── ChurchModule                    (uses organizationId query param)
  │
  ├── JournalModule                   (user-scoped, no org dependency)
  ├── DailyScriptureModule            (user-scoped, no org dependency)
  ├── FocusTimerModule                (user-scoped, no org dependency)
  │
  └── PrimeModule                     (fully standalone, @Public, hardcoded org)
```

### Cross-Module Dependencies

| Consumer | Dependency | Reason |
|----------|-----------|--------|
| `AuthModule` | `OrganizationsModule` | `AuthService.switchOrganization()` needs `MembershipService` to validate active membership before issuing org-scoped token |
| `TenantGuard` (core) | `OrganizationsModule` | Re-queries DB for live membership status on every guarded request |
| `UsersModule` | none | Self-contained |
| `PrimeModule` | none | Fully isolated; `organizationId` is hardcoded, no service imports |

---

## 5. Multi-Tenancy Architecture

### Tenant Model

```
Platform (FaithCare)
  └── Organization  (1 per church, the "tenant")
        ├── has many Memberships
        ├── has many FirstTimers
        ├── has many PrayerRequests
        ├── has many SalvationRecords
        ├── has many Communities
        ├── has many FollowUpTemplates
        └── has many MessageLogs
```

Tenants are **not isolated at the database level** (no separate databases or collections per tenant). Instead, **every document that belongs to a tenant carries an `organizationId` field**, and all queries filter by it. This is the **shared-schema, row-level isolation** model.

### Membership as the Join Table

The `Membership` document is the cornerstone of multi-tenancy. It encodes:

```
User ────────────────────── Membership ──────────────────── Organization
                               │
                ┌──────────────┼──────────────┐
                │              │              │
           MembershipRole  MembershipStatus  OrganizationRole
           (app perms)     (account state)   (church title)
           OWNER/ADMIN/    ACTIVE/INVITED/   SENIOR_PASTOR/
           MEMBER          SUSPENDED         WORSHIP_LEADER/...
```

A single user can have **multiple Membership records** — one per organization they belong to. The compound unique index `{ userId, organization }` enforces one membership per user per org.

### Two-Token Flow

The multi-tenancy context is encoded directly in the JWT, not resolved from a header:

```
Step 1 — Global Login
  POST /auth/login
  → Access token: { sub, email, role }
     No activeOrganizationId → cannot access tenant routes

Step 2 — Context Switch
  POST /auth/switch-organization/:organizationId
  (requires global token)
  → Verify ACTIVE membership in DB
  → Issue org-scoped token: { sub, email, role,
      activeOrganizationId, activeOrganizationRole }

Step 3 — Use Tenant Routes
  Any route protected by TenantGuard
  → TenantGuard reads activeOrganizationId from JWT
  → Re-queries DB to confirm membership still ACTIVE
  → Grants or denies access
```

**Why two tokens?** A user may belong to multiple orgs. Rather than passing `X-Organization-ID` as a header on every request (easy to forge or misroute), the org context is embedded in the signed JWT. Switching org context issues a fresh token, making the context tamper-proof and self-contained.

**Why re-query on every request?** The JWT may have been issued when the membership was ACTIVE, but an admin could have SUSPENDED the user after issuance. The DB re-check in `TenantGuard` closes this window — membership revocation is reflected on the next request, not at token expiry.

---

## 6. Identity & Access Control Architecture

### Guard Execution Order

All guards are applied in a fixed chain on every request:

```
Incoming Request
      │
      ▼
  @Public()?
  ┌── YES ──► Skip JwtAuthGuard entirely
  │
  NO
  │
  ▼
JwtAuthGuard  (global, APP_GUARD)
  ├── Extract Bearer token
  ├── Verify with JWT_SECRET
  ├── Attach payload to request.user
  └── Throw UnauthorizedException (human-readable) on failure
      │
      ▼
RolesGuard  (global, APP_GUARD)
  ├── Check @Roles(...) metadata on handler/class
  ├── No metadata? → pass through
  └── Compare user.role against required roles → 403 if insufficient
      │
      ▼
TenantGuard  (opt-in, @UseGuards(TenantGuard) on route/controller)
  ├── activeOrganizationId present in JWT? → 403 if not
  ├── :organizationId route param matches JWT value? → 403 if mismatch
  └── findActiveMembership(userId, orgId) in DB → 403 if not ACTIVE
      │
      ▼
  Route Handler
```

### Access Control Matrix

```
                          No Token    Global Token    Org-scoped Token
                          ─────────   ────────────    ────────────────
Public routes (@Public)      ✓            ✓                ✓
Auth routes (login/register) ✓            ✓                ✓
User-scoped routes           ✗            ✓                ✓
Org routes (no TenantGuard)  ✗            ✓                ✓
Org routes (+ TenantGuard)   ✗            ✗                ✓ (if ACTIVE)
ADMIN-only routes            ✗       ✓ (if ADMIN)     ✓ (if ADMIN)
```

### Role Hierarchy

```
Platform Roles (Role enum — on User):
  SUPER_ADMIN        ← full platform access (manually assigned)
    └── ADMIN        ← org admin; auto-promoted on org creation
          └── USER   ← default for all registered users

Membership Roles (MembershipRole enum — on Membership):
  OWNER  → full control of the org
    └── ADMIN  → manage members (not owner)
          └── MEMBER  → read access only

Organization Roles (OrganizationRole enum — on Membership):
  Purely informational church titles. Not enforced by any guard.
  SENIOR_PASTOR · ASSOCIATE_PASTOR · YOUTH_PASTOR
  WORSHIP_LEADER · CHURCH_ADMIN · VOLUNTEER_LEADER · OTHER
```

---

## 7. Data Architecture

### Collection Map

```
MongoDB: faith-care
  │
  ├── users                         (User)
  ├── usermetadata                  (UserMetaData — 1:1 with User)
  ├── organizationusersettings      (per-user per-org prefs)
  │
  ├── organizations                 (Organization — the tenant)
  ├── memberships                   (Membership — user↔org join table)
  ├── communities                   (Community — sub-groups in an org)
  ├── prayerrequests                (org-level prayer requests)
  ├── salvationrecords              (org-level salvation tracking)
  │
  ├── firsttimers                   (visitor records, QR registrations)
  ├── secondtimers                  (repeat visitors)
  ├── followups                     (care task per first-timer)
  ├── followuptemplates             (message templates per org)
  ├── messagelogs                   (delivery records)
  │
  ├── journalentries                (user's personal journal)
  ├── dailyscriptures               (one per user per day)
  ├── focustimers                   (Pomodoro sessions per user)
  │
  ├── otps                          (email verification / password reset)
  │         └── TTL index on expiresAt (MongoDB auto-deletes expired)
  │
  ├── prime_workforce_applications  (Prime-specific)
  ├── prime_trybe_applications      (Prime-specific)
  └── prime_prayer_requests         (Prime-specific)
```

### Soft Delete Pattern

All documents that extend `BaseSchema` are never permanently removed via the standard delete flow:

```
isDeleted: false  ──► softDelete() ──► isDeleted: true, deletedAt: Date
                                               │
                                               ▼
                                     Hidden from all findAll()/findOne()
                                     queries (filter: { isDeleted: false })

                       restore() ──► isDeleted: false, deletedAt: null
```

Hard delete (`delete()`) is available on `BaseRepository` but reserved for specific cases (e.g. test cleanup). The default delete action in all controllers calls `softDelete`.

### Tenant Data Isolation

Every document owned by an org carries `organizationId`:

```typescript
// Every org-scoped query is filtered like this:
this.repository.findAll({ organizationId, isDeleted: false })

// TenantGuard ensures the requester's JWT org matches the route org,
// so cross-tenant leakage at the query level is impossible.
```

### Key Indexes

| Collection | Index | Type | Purpose |
|-----------|-------|------|---------|
| `users` | `{ email: 1 }` | unique | Login lookup |
| `organizations` | `{ slug: 1 }` | unique | Tenant resolution by slug |
| `memberships` | `{ userId: 1, organization: 1 }` | unique | One membership per user per org |
| `memberships` | `{ organization: 1, status: 1 }` | compound | List org's active members |
| `memberships` | `{ userId: 1, status: 1 }` | compound | List user's orgs |
| `otps` | `{ expiresAt: 1 }` | TTL | Auto-expire OTP documents |
| `otps` | `{ email: 1 }` | — | Fast OTP lookup by email |

---

## 8. Request Lifecycle

### Standard Authenticated Request (e.g. `GET /api/v1/journal/entries`)

```
Client
  │  Authorization: Bearer <access_token>
  ▼
Vercel Edge
  │  rewrite: /(.*) → /api/index
  ▼
api/index.js
  │  require('../dist/lambda').default
  ▼
lambda.ts — exported handler
  │  await bootstrapPromise (no-op after first request)
  ▼
ExpressAdapter (Express v5 underlying server)
  │
  ├── CORS headers (origin: *)
  ├── JSON body parser
  ├── URL-encoded body parser
  │
  ▼
NestJS Request Pipeline
  │
  ├── JwtAuthGuard        — verify Bearer token, attach user to req
  ├── RolesGuard          — check @Roles() metadata (none here → pass)
  │
  ├── ValidationPipe      — transform & validate incoming body/params
  │
  ▼
JournalEntryController.findAll()
  │  @CurrentUser() → user from JWT payload
  ▼
JournalService.findAll({ userId: user.sub })
  ▼
JournalRepository.findAll({ userId, isDeleted: false })
  │  this.model.find(filter).exec()
  ▼
MongoDB Atlas
  │  returns documents
  ▼
JournalService → JournalController
  │  return { success: true, data: [...], meta: { ... } }
  ▼
GlobalErrorFilter (no error → pass through)
  ▼
Client receives 200 JSON response
```

### Tenant-Protected Request (e.g. `GET /api/v1/organizations/:orgId/members`)

```
... (same JWT validation as above) ...
  │
  ├── TenantGuard
  │     ├── user.activeOrganizationId present?        → 403 if absent
  │     ├── activeOrganizationId === route :orgId?    → 403 if mismatch
  │     └── findActiveMembership(userId, orgId) in DB → 403 if not ACTIVE
  │
  ▼
MembershipController.getMembers(:organizationId)
  ▼
MembershipService.getOrganizationMembers(organizationId)
  ▼
MembershipRepository.findByOrganization(organizationId)
  │  filter: { organization: organizationId, status: ACTIVE, isDeleted: false }
  │  populate: userId (name, email, role, createdAt)
  ▼
MongoDB → response
```

### Cold-Start Flow on Vercel

```
First request arrives to a new Vercel container
  │
  ├── lambda.ts module loads
  │     └── bootstrapPromise = bootstrap()  ← fires immediately
  │
  ├── Request awaits bootstrapPromise
  │
  ├── bootstrap() runs:
  │     ├── NestFactory.create(AppModule, new ExpressAdapter())
  │     ├── Register guards, pipes, filters, cors
  │     ├── Build Swagger document
  │     ├── app.init()
  │     └── handler = adapter.getInstance()  ← stores HTTP handler
  │
  └── handler(req, res)  ← request is processed

All subsequent requests within the same container lifetime:
  handler is cached → no bootstrap overhead
```

---

## 9. Build & Deployment Architecture

### Build System

```
npm run build
  └── nest build --webpack
        ├── Entry: src/main.ts   → dist/main.js    (standard server)
        ├── Entry: src/lambda.ts → dist/lambda.js  (Vercel serverless)
        │
        ├── tsconfig-paths-webpack-plugin
        │     └── Resolves all src/ path aliases at bundle time
        │         e.g. 'src/core/guards/...' → actual file path
        │
        └── Outputs self-contained bundles (no node_modules required
            to be present at runtime for internal imports)
```

**Why webpack?** The `tsc` compiler outputs `require('src/core/...')` verbatim — Node.js cannot resolve these paths without `tsconfig-paths/register`. Webpack resolves all aliases at bundle time, producing deployment-ready files without runtime path-resolution tricks.

### Deployment Targets

```
┌──────────────────────────────────────────────────────────────┐
│  Vercel (Primary)                                            │
│                                                              │
│  vercel.json                                                 │
│    buildCommand: npm run build                               │
│    rewrites: /(.*) → /api/index                              │
│    functions/api/index.js: maxDuration 30s                   │
│                                                              │
│  api/index.js                                                │
│    module.exports = require('../dist/lambda').default        │
│                                                              │
│  Entry: dist/lambda.js                                       │
│  Handler: exported async fn (req, res)                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Render / Railway / Heroku (Alternative)                     │
│                                                              │
│  Build:  npm install && npm run build                        │
│  Start:  node dist/main.js                                   │
│                                                              │
│  Entry: dist/main.js                                         │
│  Server: app.listen(PORT)                                    │
└──────────────────────────────────────────────────────────────┘
```

### Vercel-Specific Constraints

| Constraint | Solution |
|-----------|---------|
| `process.exit()` crashes container | Bootstrap errors are caught, stored in `bootstrapError`, returned as 500 JSON |
| Static files from `node_modules` not accessible | Swagger UI assets loaded from CDN (`unpkg.com/swagger-ui-dist@5.31.0`) |
| MongoDB Atlas cold-connect latency | `serverSelectionTimeoutMS: 3000`, `connectTimeoutMS: 3000` to fail fast |
| `@nestjs/cli` not available when `NODE_ENV=production` | `@nestjs/cli` moved to `dependencies` (not `devDependencies`) |

---

## 10. Key Design Decisions & Trade-offs

### Decision 1 — Shared Database, Row-Level Isolation (not per-tenant DB)

**Chosen:** All tenants share the same MongoDB database and collections, isolated by `organizationId` fields.

**Trade-off:** Simpler to operate and scale at this stage. If one tenant's data is breached at the DB level, other tenants are at risk. Acceptable for current stage — a misconfigured query would need to bypass both the application query filters and the TenantGuard to leak data.

**Alternative considered:** Separate database per tenant — more isolated but operationally expensive, requires dynamic connection pooling, not worth it for current tenant count.

---

### Decision 2 — JWT-Encoded Tenant Context (not header-based)

**Chosen:** Org context is embedded in the JWT via `activeOrganizationId`. Users must call `POST /auth/switch-organization` to get an org-scoped token.

**Trade-off:** Slightly more friction for the client (two-step login for org users). The payoff is that org context is cryptographically signed — a rogue client cannot forge a different org context. There is also no need for server-side session state.

**Alternative considered:** Pass `X-Organization-ID` header on every request — simpler client flow, but trivially forgeable and requires the server to re-validate on every request without the signed guarantee.

---

### Decision 3 — TenantGuard DB Re-check on Every Request

**Chosen:** `TenantGuard` always calls `findActiveMembership()` in MongoDB, even though the membership status is not in the JWT.

**Trade-off:** One extra DB query per guarded request. The JWT alone cannot be trusted for membership status because it could have been issued before the membership was SUSPENDED. The DB re-check ensures membership revocation takes effect immediately.

**Alternative considered:** Embed membership status in the JWT — faster (no extra query) but means a suspended member can continue acting until token expiry (up to 8 hours).

---

### Decision 4 — Webpack Build (not tsc alone)

**Chosen:** `nest build --webpack` is the build command, producing bundled `dist/main.js` and `dist/lambda.js`.

**Trade-off:** Webpack bundles are harder to debug (less obvious stack traces). However, it resolves all `src/` TypeScript path aliases at bundle time, eliminating the `Cannot find module 'src/core/...'` errors that `tsc` alone produces in serverless environments.

**Alternative considered:** Use `tsc-alias` or `tsconfig-paths` at runtime — adds runtime complexity and has been known to fail in certain serverless cold-start environments.

---

### Decision 5 — Enum Props Require `type: String` Explicitly

**Chosen:** All Mongoose `@Prop({ enum: ... })` decorators include `type: String` explicitly.

**Why:** Webpack strips TypeScript metadata at bundle time (`emitDecoratorMetadata` output is incomplete). Without `type: String`, Mongoose cannot determine the field type at runtime and throws `CannotDetermineTypeError`. This is a non-obvious webpack/NestJS/Mongoose interaction that affects all enum fields across all schemas.

---

### Decision 6 — Prime Module as Fully Isolated Public Module

**Chosen:** The `PrimeModule` is a self-contained module with no dependencies on other modules. The `organizationId` for Prime Church is hardcoded as a constant.

**Trade-off:** If Prime's organization ID changes in MongoDB, the code must be updated. This is accepted because Prime Church is the product owner and their org ID is permanent.

**Why not look up the org dynamically?** It would require `PrimeModule` to import `OrganizationsModule`, adding unnecessary coupling for a fixed, known value.

---

### Decision 7 — Single Unified Login Endpoint + Role-Driven Authorization

**Chosen:** `POST /auth/login` serves all users. The `role` field in the JWT and response determines authorization level (`USER` · `ADMIN` · `SUPER_ADMIN`).

**`ADMIN` is set automatically** when a user creates an organization — they are the org's owner, so they receive elevated platform access. There is no separate "organization admin" role; `ADMIN` is the only elevated role below `SUPER_ADMIN`.

**Why:** There is no functional difference between "admin login" and "user login" — both are email + password. Splitting them creates confusion and redundant code. The client reads `user.role` to decide which UI and features to enable.

---

## 11. Boundaries & Constraints

### What This System Does NOT Do

| Missing Feature | Notes |
|----------------|-------|
| **Real-time events** | No WebSockets; all communication is request/response |
| **Background jobs / queues** | No scheduled tasks or async job processing |
| **File uploads** | No media storage; no `multipart/form-data` file handling |
| **Google OAuth** | Endpoints exist but return placeholder responses |
| **Password reset flow** | OTP type `password_reset` exists in the schema but no dedicated endpoint completes the reset |
| **SMS delivery** | SMS config is in env variables but no SMS provider is connected |
| **WhatsApp delivery** | Follow-up template channel includes `whatsapp` but no delivery integration exists |
| **Push notifications** | No mobile push capability |
| **Cron / scheduled follow-up** | `followUpScheduledAt` is stored but no scheduler fires on it |

### Hard-Coded Values

| Value | Location | Purpose |
|-------|---------|---------|
| `69bd8cd5ec1a44c866c52113` | `PrimeModule` schemas/services | Prime Church's MongoDB `_id` |
| `10 minutes` | `AuthService.createAndSendOtp()` | OTP expiry window |
| `salt: 12` | `AuthService.userRegister()` | bcrypt cost factor for passwords |
| `salt: 10` | `AuthService.createAndSendOtp()` | bcrypt cost factor for OTP hashes |
| `28800` (8h) | `AuthService.login()` | Access token TTL in seconds |
| `90d` | `AuthService.signTokens()` | Refresh token TTL |
| `25` (minutes) | `FocusTimer` default | Pomodoro session duration |

---

## 12. Scalability Considerations

### Current Bottlenecks

| Bottleneck | Impact | Mitigation Path |
|-----------|--------|----------------|
| **Single MongoDB Atlas cluster** | All tenants on one cluster; large orgs could degrade others | Atlas scaling tiers, read replicas |
| **No query result caching** | Identical queries hit MongoDB on every request | Redis layer in front of `findAll()` for frequently-read, rarely-changed data (e.g. org settings, templates) |
| **Vercel serverless cold starts** | First request to a cold container bootstraps NestJS (~1–2s) | Bootstrap is pre-fired at module load time; can be further improved with Vercel Fluid Compute |
| **TenantGuard DB query per request** | Every guarded request hits MongoDB for membership check | Acceptable at current scale; could be cached by `(userId, orgId)` key with short TTL |

### Horizontal Scaling Readiness

- **Stateless application** — no in-memory session state; all state is in MongoDB. Multiple instances can serve requests without coordination.
- **JWT-based auth** — no server-side session store required. Any instance can validate any token.
- **No singleton side effects** — no in-process caches that would diverge across instances.

### When to Extract a Service

The current modular monolith should remain unified until one of these thresholds is hit:

| Signal | Module to Extract |
|-------|-----------------|
| Follow-up message delivery becomes high volume | `ChurchModule` → async message queue worker |
| First-timer QR registration spikes (e.g. large events) | `FirstTimersModule` → dedicated write service |
| Prime Church forms need rate limiting / spam protection | `PrimeModule` → edge function or separate API |
| Spiritual tools (journal/scripture/timer) need offline sync | User-scoped modules → separate sync API |
