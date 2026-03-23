# FaithCare Backend — Technical Documentation

> **Stack:** NestJS v11 · MongoDB (Mongoose) · JWT Auth · Vercel Serverless
> **Purpose:** REST API powering Prime Church's digital care and spiritual growth platform.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Entry Points](#2-entry-points)
3. [Multi-Tenancy Model](#3-multi-tenancy-model)
4. [Authentication & Token Flow](#4-authentication--token-flow)
5. [Guards & Access Control](#5-guards--access-control)
6. [Core Base Classes](#6-core-base-classes)
7. [Modules & Entities](#7-modules--entities)
   - [Users](#71-users-module)
   - [Auth](#72-auth-module)
   - [Organizations](#73-organizations-module)
   - [First Timers (ChurchCare)](#74-first-timers-module)
   - [Church (Follow-Up & Dashboard)](#75-church-module)
   - [Journal](#76-journal-module)
   - [Daily Scripture](#77-daily-scripture-module)
   - [Focus Timer](#78-focus-timer-module)
   - [Prime Church](#79-prime-module)
   - [Health](#710-health-module)
8. [Entity Relationship Map](#8-entity-relationship-map)
9. [Enum Reference](#9-enum-reference)
10. [Request / Response Contracts](#10-request--response-contracts)
11. [Common Patterns](#11-common-patterns)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)

---

## 1. High-Level Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        Clients                             │
│          (Web App · Mobile App · Public Forms)             │
└───────────────────────┬────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌────────────────────────────────────────────────────────────┐
│                   Vercel Edge / CDN                        │
│   All traffic rewritten to  /api/index  (lambda.ts)        │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│              NestJS Application (Express v5)               │
│                                                            │
│  Global prefix: /api/v1          Swagger: /api/v1/docs     │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ JwtAuth  │  │  RolesGuard  │  │  GlobalErrorFilter   │  │
│  │  Guard   │  │  (APP_GUARD) │  │  ValidationPipe      │  │
│  │(APP_GUARD│  └──────────────┘  └─────────────────────┘  │
│  └──────────┘                                              │
│                                                            │
│  ┌─────────┐ ┌──────┐ ┌───────────────┐ ┌─────────────┐  │
│  │  Auth   │ │Users │ │ Organizations │ │ FirstTimers │  │
│  ├─────────┤ ├──────┤ ├───────────────┤ ├─────────────┤  │
│  │ Journal │ │Daily │ │  FocusTimer   │ │   Church    │  │
│  │         │ │Script│ │               │ │  (follow-up)│  │
│  ├─────────┤ └──────┘ └───────────────┘ └─────────────┘  │
│  │  Prime  │ ┌──────┐                                     │
│  │ (public)│ │Health│                                     │
│  └─────────┘ └──────┘                                     │
└───────────────────────┬────────────────────────────────────┘
                        │ Mongoose
                        ▼
┌────────────────────────────────────────────────────────────┐
│              MongoDB Atlas (faith-care DB)                  │
│                                                            │
│  users · memberships · organizations · first_timers        │
│  otp · journal_entries · focus_timers · daily_scriptures   │
│  prime_workforce_applications · prime_trybe_applications   │
│  prime_prayer_requests · follow_up_templates · ...         │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Entry Points

The application has **two entry points** that bootstrap the same `AppModule` — one for local/Render and one for Vercel serverless.

### `src/main.ts` — Standard Express Server

Used when running `npm run start:dev` or `npm run start:prod` (Render, Railway, Heroku).

```
bootstrap()
  ├── NestFactory.create(AppModule)
  ├── app.enableCors({ origin: '*' })
  ├── app.useGlobalPipes(ValidationPipe)
  ├── app.useGlobalFilters(GlobalErrorFilter)
  ├── app.setGlobalPrefix('api/v1', { exclude: ['/'] })
  ├── SwaggerModule.setup('api/v1/docs', ...)  ← CDN assets
  └── app.listen(PORT)
```

### `src/lambda.ts` — Vercel Serverless Handler

Used on Vercel. Imported by `api/index.js`.

Key design decisions:
- **No custom Express instance** — uses `new ExpressAdapter()` and calls `adapter.getInstance()` after `app.init()` to get the underlying HTTP handler.
- **Bootstrap caching** — `bootstrap()` is fired immediately at module load time. On cold start the first request awaits the promise; subsequent requests hit the cached `handler`.
- **No `process.exit()`** — errors are caught, stored in `bootstrapError`, and returned as 500 JSON so the Vercel container keeps running.

```
api/index.js
  └── require('../dist/lambda').default
        └── export default async (req, res) => {
              if (!handler) await bootstrapPromise;
              if (bootstrapError) return 500 JSON;
              handler(req, res);
            }
```

### Build System

```
nest build --webpack
  ├── Bundles src/main.ts  → dist/main.js
  └── Bundles src/lambda.ts → dist/lambda.js

webpack.config.js defines both entry points.
tsconfig.json uses module: commonjs (required for webpack compatibility).
```

---

## 3. Multi-Tenancy Model

FaithCare is a **multi-tenant SaaS** where each tenant is an **Organization** (a church). A single user can belong to multiple organizations with different roles in each.

### Conceptual Model

```
Platform
  └── Organization (tenant)  e.g. "Prime Church Lagos"
        └── Membership  (user ↔ org join table)
              ├── MembershipRole  → controls app permissions (OWNER / ADMIN / MEMBER)
              └── OrganizationRole → church title (SENIOR_PASTOR / WORSHIP_LEADER / ...)
```

### Two-Token Strategy

```
Step 1: Login
  POST /auth/login
  → Returns global access token  (no activeOrganizationId)

Step 2: Switch into an org context
  POST /auth/switch-organization/:organizationId
  → Verifies ACTIVE membership
  → Returns org-scoped token  { ...payload, activeOrganizationId, activeOrganizationRole }

Step 3: Use org-scoped token for tenant-protected routes
  → TenantGuard checks JWT + re-queries DB for live membership status
```

### Data Isolation

All org-owned data documents store an `organizationId` field. Queries always filter by `organizationId` — there is no global query that leaks cross-tenant data. The `TenantGuard` adds a DB-level re-check on every request to confirm the membership is still `ACTIVE` (not revoked since the token was issued).

---

## 4. Authentication & Token Flow

### Registration & Email Verification

```
POST /auth/register
  ├── Check email uniqueness
  ├── Hash password (bcrypt, salt: 12)
  ├── Create User (isEmailVerified: false, role: USER)
  └── Send 6-digit OTP to email (expires 10 min)

POST /auth/verify-email  { email, otp }
  ├── Validate OTP hash
  ├── Mark OTP as used
  ├── Set isEmailVerified: true
  ├── Send welcome email
  └── Return { accessToken, refreshToken }
```

### Login

```
POST /auth/login  { email, password }
  ├── Find user by email (any role)
  ├── Verify password (bcrypt.compare)
  ├── If not verified → resend OTP, return 401
  └── Return { accessToken (8h), refreshToken (90d), user: { role } }
       ↑
       role is read by the client to determine access level:
         USER       → regular member
         ADMIN      → organization admin (auto-set on org creation)
         SUPER_ADMIN → full platform access
```

### Token Refresh

```
POST /auth/refresh  { refreshToken }
  ├── Validate with REFRESH_TOKEN_SECRET
  └── Return new accessToken
```

### Organization Switch

```
POST /auth/switch-organization/:organizationId
  ├── Require valid global JWT
  ├── findActiveMembership(user.id, organizationId)
  ├── Throw ForbiddenException if not ACTIVE member
  └── Sign new token with { ...payload, activeOrganizationId, activeOrganizationRole }
```

### JWT Payload Shape

```typescript
{
  sub: string;                    // User._id
  email: string;
  role: Role;                     // Global platform role
  activeOrganizationId?: string;  // Present only after switch-organization
  activeOrganizationRole?: string;
  iat: number;
  exp: number;
}
```

### OTP Schema

| Field | Type | Notes |
|-------|------|-------|
| `email` | string | Indexed |
| `hashedOtp` | string | bcrypt hash of 6-digit code |
| `type` | enum | `email_verification` \| `password_reset` |
| `expiresAt` | Date | 10 minutes from creation; MongoDB TTL index auto-deletes |
| `used` | boolean | Consumed on first valid use |

---

## 5. Guards & Access Control

Guards are applied in this order on every request:

```
Request
  │
  ▼
JwtAuthGuard (APP_GUARD — global)
  ├── Bypass: @Public() decorator present
  ├── Extract Bearer token from Authorization header
  ├── Verify with JWT_SECRET
  ├── Attach user to request.user
  └── Human-readable errors:
      · "Your session has expired. Please log in again."
      · "You are not logged in. Please log in to access this resource."
  │
  ▼
RolesGuard (APP_GUARD — global)
  ├── Read @Roles(...) metadata from handler/class
  ├── If no metadata → pass through
  └── Compare user.role against required roles
  │
  ▼
TenantGuard (applied per-route with @UseGuards(TenantGuard))
  ├── user.activeOrganizationId must exist in JWT
  ├── Route param :organizationId must match token value
  ├── Re-query DB: findActiveMembership(user.id, orgId)
  └── Throw ForbiddenException if membership not ACTIVE
```

### Decorators

| Decorator | Purpose |
|-----------|---------|
| `@Public()` | Skips `JwtAuthGuard` |
| `@Roles(...roles)` | Restricts to listed roles (checked by `RolesGuard`) |
| `@CurrentUser()` | Injects `request.user` (JWT payload) into handler param |

---

## 6. Core Base Classes

### `BaseSchema`

All Mongoose schemas extend this. Provides soft-delete fields.

```typescript
isDeleted: boolean    // default: false
deletedAt?: Date      // default: null
```

### `BaseRepository<T>`

Generic Mongoose repository injected into every repository class.

| Method | Description |
|--------|-------------|
| `create(data)` | Insert document |
| `findAll(filter?)` | Find all matching (excludes soft-deleted) |
| `findOne(filter)` | Find first match |
| `findById(id)` | Find by `_id` |
| `update(id, update)` | `findByIdAndUpdate` |
| `delete(id)` | Hard delete |
| `softDelete(id)` | Sets `isDeleted=true`, `deletedAt=now` |
| `restore(id)` | Undeletes |
| `paginate(filter, {page, limit})` | Returns `{ data, meta }` |

### `BaseService<T>`

Thin wrapper around `BaseRepository`. All module services extend this and inherit the same CRUD interface.

---

## 7. Modules & Entities

### 7.1 Users Module

**Route prefix:** `/users`

#### `User` Schema (`users` collection)

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | required |
| `email` | string | unique, required |
| `password` | string | bcrypt hashed |
| `role` | `Role` enum | default: `USER` |
| `isEmailVerified` | boolean | default: `false` |
| + BaseSchema | | `isDeleted`, `deletedAt` |

#### `UserMetaData` Schema

Holds profile preferences linked 1:1 to a User.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | unique |
| `location` | string? | |
| `organization` | ObjectId → Organization \| null | Populated on read; set when church found in system via search |
| `churchName` | string \| null | Free-text church name; set when church is not in the system |
| `spiritualGoals` | `SpiritualGoals` | sub-document of booleans |
| `currentFocusTimerId` | ObjectId → FocusTimer? | |
| `dailyBibleReadingStreakCount` | number | default: 0 |

`SpiritualGoals` sub-document fields: `dailyBibleReading`, `dailyPrayer`, `consistentPrayerLife`, `scriptureMemorization`, `scripturalJournaling`, `betterTimeManagement`, `deeperFaith`.

#### `OrganizationUserSettings` Schema

Per-user, per-org preference overrides.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | |
| `organizationId` | ObjectId → Organization | |
| `notifications` | object | `newFirstTimers`, `newPrayerRequests`, `pendingFollowUpReminders` |
| `theme` | `LIGHT` \| `DARK` | default: `LIGHT` |
| `is2FAEnabled` | boolean | default: `false` |
| `language` | `EN` \| `FR` | default: `EN` |
| `timeZone` | `WAT` \| `ET` | default: `WAT` |

#### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users` | JWT | Create user |
| GET | `/users` | ADMIN | List all users |
| GET | `/users/email/:email` | JWT | Find by email |
| GET | `/users/:id` | JWT | Find by ID |
| PATCH | `/users/:id` | JWT | Update user |
| DELETE | `/users/:id` | JWT | Delete user |

**User Metadata routes:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users/metadata` | JWT | Create metadata record |
| GET | `/users/metadata/user/:userId` | JWT | Get metadata by user ID (populated church) |
| GET | `/users/metadata/:id` | JWT | Get metadata by record ID |
| PATCH | `/users/metadata/:id` | JWT | Update metadata fields |
| DELETE | `/users/metadata/:id` | JWT | Delete metadata record |
| PATCH | `/users/metadata/me/church` | JWT | Connect/update church affiliation — provide `organization` (ObjectId) **or** `churchName` (string) |

---

### 7.2 Auth Module

**Route prefix:** `/auth`

#### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register |
| POST | `/auth/login` | Public | Login — `role` in response determines access level |
| GET | `/auth/google` | Public | Initiate OAuth |
| GET | `/auth/google/callback` | Public | OAuth callback |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/verify-email` | Public | Verify OTP |
| POST | `/auth/resend-otp` | Public | Resend OTP |
| POST | `/auth/switch-organization/:organizationId` | JWT | Get org-scoped token |

#### Email Service

| Method | Trigger |
|--------|---------|
| `sendOtp(email, otp, type)` | Register, forgot password |
| `sendWelcome(email, name)` | After email verification |

---

### 7.3 Organizations Module

**Route prefix:** `/organizations`

This module is the **core of the multi-tenant system**. It owns the `Organization`, `Membership`, `PrayerRequest`, `SalvationRecord`, and `Community` schemas.

#### `Organization` Schema (`organizations` collection)

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | required |
| `slug` | string | unique, auto-generated from name if omitted |
| `email` | string | required |
| `createdBy` | ObjectId → User | audit trail |
| `denomination` | `Denomination` enum | |
| `address` | string | |
| `city` | string | |
| `state` | string | |
| `zipCode` | string | |
| `phoneNumber` | string | |
| `websiteUrl` | string? | |
| `memberCountRange` | `MemberCountRange` enum | |
| `firstTimerQrCode` | string \| null | Base64 PNG data URI; encodes `{ organizationId, slug, name }` so the public first-timer form can auto-identify the org on QR scan |

Slug generation: `"Prime Church Lagos"` → `"prime-church-lagos"` (lowercased, spaces/specials replaced with hyphens).

#### `Membership` Schema (`memberships` collection)

The **join table** between users and organizations. Central to the entire multi-tenant model.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | required |
| `organization` | ObjectId → Organization | required |
| `role` | `MembershipRole` enum | `OWNER` / `ADMIN` / `MEMBER` |
| `status` | `MembershipStatus` enum | `ACTIVE` / `INVITED` / `SUSPENDED` |
| `organizationRole` | `OrganizationRole` enum \| null | Church title (e.g. `SENIOR_PASTOR`) |
| `invitedBy` | ObjectId → User \| null | Set when invited by another member |

**Indexes:**
- `{ userId, organization }` — **unique** (one membership per user per org)
- `{ organization, status }` — fast org member listing
- `{ userId, status }` — fast user org listing

#### `PrayerRequest` Schema (org-level)

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId → Organization | tenant scope |
| `name` | string | requester's name |
| `description` | string | |
| `status` | `PrayerRequestStatus` | `PENDING` / `CONTACTED` / `FOLLOWED_UP` |

#### `SalvationRecord` Schema

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId → Organization | |
| `name` | string | |
| `phoneNumber` | string? | |
| `email` | string? | |
| `decisionDate` | string | |
| `notes` | string? | |
| `status` | `SalvationStatus` | `PENDING` / `CONTACTED` / `FOLLOWED_UP` |

#### `Community` Schema

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId → Organization | |
| `name` | string | |
| `description` | string | |
| `members` | ObjectId[] → User | array |
| `profileImage` | string? | |

#### Membership Permission Matrix

| Action | OWNER | ADMIN | MEMBER |
|--------|-------|-------|--------|
| Invite member | ✓ | ✓ | ✗ |
| Remove member | ✓ | ✓ (non-owners) | ✗ |
| Update member role | ✓ | ✓ (non-owners) | ✗ |
| Assign OWNER role | ✓ | ✗ | ✗ |
| Leave org | ✗ (must transfer first) | ✓ | ✓ |
| Delete org | ✓ | ✗ | ✗ |

#### Endpoints

**Organization routes:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/organizations` | JWT | Create org (caller becomes OWNER) |
| GET | `/organizations/mine` | JWT | List user's orgs |
| GET | `/organizations/slug/:slug` | JWT | Find by slug |
| GET | `/organizations/:id` | JWT | Get org details |
| PATCH | `/organizations/:id` | JWT + TenantGuard | Update org |
| DELETE | `/organizations/:id` | JWT + TenantGuard | Soft-delete |

**Membership routes:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/organizations/:organizationId/members` | JWT + TenantGuard | List members |
| POST | `/organizations/:organizationId/members/invite` | JWT + TenantGuard | Invite |
| PATCH | `/organizations/:organizationId/members/:userId/role` | JWT + TenantGuard | Update role |
| DELETE | `/organizations/:organizationId/members/:userId` | JWT + TenantGuard | Remove |
| DELETE | `/organizations/:organizationId/members/leave` | JWT + TenantGuard | Leave |

**Prayer request routes:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/organizations/:organizationId/prayer-requests` | JWT + TenantGuard | Create |
| GET | `/organizations/:organizationId/prayer-requests` | JWT + TenantGuard | List |
| GET | `/organizations/:organizationId/prayer-requests/:id` | JWT + TenantGuard | Get one |
| PATCH | `/organizations/:organizationId/prayer-requests/:id` | JWT + TenantGuard | Update |
| DELETE | `/organizations/:organizationId/prayer-requests/:id` | JWT + TenantGuard | Delete |

---

### 7.4 First Timers Module

**Route prefix:** `/church/first-timers`

ChurchCare's visitor tracking system. Registrations come in via QR code scans.

#### `FirstTimer` Schema (`first_timers` collection)

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId → Organization | tenant scope |
| `name` | string | |
| `phoneNumber` | string | |
| `email` | string? | |
| `prayerRequest` | string? | |
| `visitType` | `first_time` \| `second_time` | default: `first_time` |
| `firstTimerId` | ObjectId → FirstTimer? | For second-timers, links to original record |
| `status` | `PENDING` \| `CONTACTED` \| `FOLLOWED_UP` | default: `PENDING` |
| `serviceDate` | string? | |
| `notes` | string? | |
| `followUpScheduledAt` | Date? | Auto-set to +3 days on creation |

#### `SecondTimer` Schema

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId → Organization | |
| `firstTimerId` | ObjectId → FirstTimer | required — links to original visit |
| `name` | string | |
| `phoneNumber` | string | |
| `email` | string | |
| `prayerRequest` | string? | |
| `status` | `FIRST_TIMER` \| `SECOND_TIMER` | |

#### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/church/first-timers` | Public | Register visitor (QR scan) |
| GET | `/church/first-timers` | JWT | List with filters & pagination |
| GET | `/church/first-timers/export` | JWT | Export CSV/Excel |
| GET | `/church/first-timers/:id` | JWT | Get record |
| PATCH | `/church/first-timers/:id/status` | JWT | Update status / notes |

**Query params for list:** `page`, `limit`, `status`, `visit_type`, `search`, `from_date`, `to_date`

---

### 7.5 Church Module

**Route prefix:** `/church`

Manages follow-up message templates, delivery logs, and an analytics dashboard.

#### `FollowUpTemplate` Schema (`follow_up_templates` collection)

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId → Organization | |
| `name` | string | |
| `trigger` | `on_registration` \| `day_3` \| `day_7` \| `manual` | |
| `channel` | `whatsapp` \| `email` \| `sms` | |
| `body` | string | Message template with `{{variables}}` |
| `variables` | string[] | e.g. `["name", "organization"]` |
| `delayDays` | number? | Days after trigger event |

#### `FollowUp` Schema

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId → Organization | |
| `newMemberId` | ObjectId → FirstTimer | |
| `name` | string | |
| `tags` | string[] | default: `['FIRST_TIMER']` |
| `priority` | `HIGH` | |
| `description` | string | |
| `dueDate` | Date | |

#### `MessageLog` Schema

Records every message sent to a first-timer (channel, status, sentAt).

#### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/church/follow-up/templates` | JWT | List templates |
| PUT | `/church/follow-up/templates/:id` | JWT | Update template |
| GET | `/church/follow-up/logs` | JWT | View message logs |
| POST | `/church/follow-up/send` | JWT | Manually trigger send |
| GET | `/church/dashboard/summary` | JWT | Aggregate metrics |
| GET | `/church/dashboard/trends` | JWT | Weekly trend data |

---

### 7.6 Journal Module

**Route prefix:** `/journal/entries`

Personal sermon and devotional journaling per user.

#### `JournalEntry` Schema (`journal_entries` collection)

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | |
| `title` | string | |
| `scriptureReference` | string? | e.g. `"John 3:16"` |
| `content` | string | |
| + BaseSchema | | |

#### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/journal/entries` | JWT | Create entry |
| GET | `/journal/entries` | JWT | List (paginated, searchable) |
| GET | `/journal/entries/:id` | JWT | Get one |
| PUT | `/journal/entries/:id` | JWT | Update |
| DELETE | `/journal/entries/:id` | JWT | Delete |

**Query params:** `page`, `limit`, `search`, `sort` (`asc`\|`desc`)

---

### 7.7 Daily Scripture Module

**Route prefix:** `/scripture`

One scripture per user per day with optional reminder preferences.

#### `DailyScripture` Schema (`daily_scriptures` collection)

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | |
| `title` | string | |
| `scriptureReference` | string | |
| `date` | Date | |
| `content` | string | |
| `isCompleted` | boolean | default: `false` |

#### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/scripture/today` | JWT | Today's scripture |
| POST | `/scripture` | JWT | Add scripture |
| GET | `/scripture/user/:userId` | JWT | List for user |
| GET | `/scripture/:date` | JWT | Get by date (YYYY-MM-DD) |
| PATCH | `/scripture/reminder/preferences` | JWT | Update reminder prefs |
| PATCH | `/scripture/:id` | JWT | Update entry |
| DELETE | `/scripture/:id` | JWT | Delete |

---

### 7.8 Focus Timer Module

**Route prefix:** `/timer/sessions`

Pomodoro-style 25-minute sessions. On completion, a scripture is returned as a reward.

#### `FocusTimer` Schema (`focus_timers` collection)

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → User | |
| `duration` | number | minutes, default: 25 |
| `status` | `FocusTimerStatus` enum | `NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` / `CANCELLED` |
| `currentProgress` | number | seconds elapsed, default: 0 |

#### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/timer/sessions` | JWT | Start session |
| GET | `/timer/sessions` | JWT | List sessions |
| GET | `/timer/sessions/active` | JWT | Get active session |
| GET | `/timer/sessions/:id` | JWT | Get session |
| PATCH | `/timer/sessions/:id/complete` | JWT | Complete → get scripture reward |
| PATCH | `/timer/sessions/:id/pause` | JWT | Pause |
| PATCH | `/timer/sessions/:id` | JWT | Update |
| DELETE | `/timer/sessions/:id` | JWT | Delete |

---

### 7.9 Prime Module

**Route prefix:** `/prime`
**Auth:** All endpoints are `@Public()` — no login required

This module serves **external form submissions** from Prime Church's public web pages. All records are hardcoded to Prime's organization ID (`69bd8cd5ec1a44c866c52113`).

#### Collections

| Schema | Collection | Description |
|--------|------------|-------------|
| `WorkforceApplication` | `prime_workforce_applications` | Volunteer interest forms |
| `TrybeApplication` | `prime_trybe_applications` | Trybe community joins |
| `PrimePrayerRequest` | `prime_prayer_requests` | Public prayer request submissions |

#### `WorkforceApplication` Schema

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId | hardcoded to Prime org |
| `fullName` | string | |
| `phoneNumber` | string | |
| `email` | string | |
| `address` | string | |
| `haveServedInADepartment` | boolean | |
| `departmentToServeIn` | `Department[]` | at least 1, see enum below |

**Department enum values:** `SOUND_TRYBE` · `USHERING_GREETERS_PROTOCOL` · `PRAYER_BIBLE_STUDY` · `PUBLICITY_OUTREACH` · `PROGRAMS` · `MEDIA_TECHNICAL` · `PROGRAMS_VENUE_MANAGEMENT` · `MEMBERSHIP` · `WELFARE_HOSPITALITY`

#### `TrybeApplication` Schema

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId | hardcoded to Prime org |
| `name` | string | |
| `phoneNumber` | string | |
| `email` | string | |
| `gender` | `Gender` | `MALE` \| `FEMALE` |
| `isAMember` | `TrybeMembershipStatus` | `YES` \| `NO` \| `NEW_MEMBER` |
| `skills` | string | free text |
| `whatWouldYouLikeToDo` | `TrybeIntent` | `JOIN` \| `LEAD` \| `JOIN_FIRST` |
| `whyWouldYouLikeToJoin` | string | free text |
| `whichTrybeCategoryToJoin` | `TrybeCategory` | `TECH` \| `CAREER` \| `CREATIVE` \| `ENTREPRENEUR` |

#### `PrimePrayerRequest` Schema

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | ObjectId | hardcoded to Prime org |
| `name` | string | |
| `email` | string | |
| `prayerRequest` | string | |
| `status` | `PrayerRequestStatus` | `PENDING` / `CONTACTED` / `FOLLOWED_UP` |

#### Endpoints

| Method | Path | Auth | Accepts |
|--------|------|------|---------|
| POST | `/prime/workforce` | Public | JSON or form-encoded |
| POST | `/prime/trybe` | Public | JSON or form-encoded |
| POST | `/prime/prayer-request` | Public | JSON or form-encoded |

---

### 7.10 Health Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | MongoDB ping + process uptime |

---

## 8. Entity Relationship Map

```
User ─────────────────────────────────────────────────────────────────┐
  │                                                                    │
  │ 1:1  UserMetaData                                                  │
  │ 1:1  OrganizationUserSettings (per org)                            │
  │                                                                    │
  │ via Membership (join table)                                        │
  │                                                                    │
  ▼             ▼                                                       │
Membership ──── Organization                                           │
  (OWNER/ADMIN/MEMBER)  │                                              │
  (role = church title) │                                              │
                        │ 1:N                                          │
                        ├── FirstTimer ──────── SecondTimer            │
                        │        │                                     │
                        │        └── FollowUp                          │
                        │                                              │
                        ├── PrayerRequest (org-level)                  │
                        ├── SalvationRecord                            │
                        ├── Community (member list = User[])  ─────────┘
                        ├── FollowUpTemplate
                        └── MessageLog

User (independent of org)
  ├── JournalEntry
  ├── DailyScripture
  └── FocusTimer

Prime Org (hardcoded: 69bd8cd5ec1a44c866c52113)
  ├── WorkforceApplication   [prime_workforce_applications]
  ├── TrybeApplication       [prime_trybe_applications]
  └── PrimePrayerRequest     [prime_prayer_requests]

OTP  (standalone — linked only by email string, not ObjectId ref)
```

---

## 9. Enum Reference

### `Role` — Global platform role (on User)
| Value | Access |
|-------|--------|
| `USER` | Default for all registered users |
| `ADMIN` | Set automatically when a user creates an organization — grants org admin access |
| `SUPER_ADMIN` | Full platform access, highest privilege |

### `MembershipRole` — Controls permissions within an org (on Membership)
| Value | Can Do |
|-------|--------|
| `OWNER` | Everything; cannot leave without transfer |
| `ADMIN` | Invite/remove/update non-owners |
| `MEMBER` | Read access only |

### `OrganizationRole` — Church title (on Membership, captured at org creation)
`SENIOR_PASTOR` · `ASSOCIATE_PASTOR` · `YOUTH_PASTOR` · `WORSHIP_LEADER` · `CHURCH_ADMIN` · `VOLUNTEER_LEADER` · `OTHER`

### `MembershipStatus`
`ACTIVE` · `INVITED` · `SUSPENDED`

### `Department` (Workforce applications)
`SOUND_TRYBE` · `USHERING_GREETERS_PROTOCOL` · `PRAYER_BIBLE_STUDY` · `PUBLICITY_OUTREACH` · `PROGRAMS` · `MEDIA_TECHNICAL` · `PROGRAMS_VENUE_MANAGEMENT` · `MEMBERSHIP` · `WELFARE_HOSPITALITY`

### `Gender`
`MALE` · `FEMALE`

### `TrybeMembershipStatus` (isAMember field)
`YES` · `NO` · `NEW_MEMBER`

### `TrybeIntent` (whatWouldYouLikeToDo)
`JOIN` · `LEAD` · `JOIN_FIRST`

### `TrybeCategory`
`TECH` · `CAREER` · `CREATIVE` · `ENTREPRENEUR`

### `FocusTimerStatus`
`NOT_STARTED` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED`

### `PrayerRequestStatus`
`PENDING` · `CONTACTED` · `FOLLOWED_UP`

### `Denomination`
`NON_DENOMINATIONAL` · `BAPTIST` · `METHODIST` · `PRESBYTERIAN` · `PENTECOSTAL` · `LUTHERAN` · `EPISCOPAL` · `OTHER`

### `MemberCountRange`
`0-50` · `51-100` · `101-250` · `251-500` · `501-1000` · `1000+`

---

## 10. Request / Response Contracts

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

Or for actions with no returned data:

```json
{
  "success": true,
  "message": "Operation completed."
}
```

### Error Response (GlobalErrorFilter)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "timestamp": "2026-03-22T10:00:00.000Z",
  "path": "/api/v1/auth/user/login",
  "errors": { ... },
  "stack": "..."
}
```

> `stack` is only included when `NODE_ENV=development`.

---

## 11. Common Patterns

### Soft Delete

```
PATCH /some-resource/:id  → softDelete()
  Sets: isDeleted=true, deletedAt=<now>
  All findAll()/findOne() queries filter { isDeleted: false }
  Hard delete via delete() only used in specific cases
```

### Pagination

All list endpoints that support pagination return:

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Enum Props in Mongoose (Webpack)

Because the build uses webpack (which strips TypeScript metadata), **all enum `@Prop()` decorators must include `type: String` explicitly**:

```typescript
// CORRECT
@Prop({ type: String, enum: Role, default: Role.USER })
role: Role;

// WRONG — CannotDetermineTypeError at runtime
@Prop({ enum: Role, default: Role.USER })
role: Role;
```

### Path Alias Resolution

Source uses `src/` path aliases (e.g. `import ... from 'src/core/guards/...'`). These are resolved at **webpack bundle time** — `tsc` alone does not resolve them. This is why the build must use `nest build --webpack`.

---

## 12. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Access token signing secret |
| `REFRESH_TOKEN_SECRET` | Yes | Refresh token signing secret |
| `JWT_EXPIRES_IN` | No | Default: `8h` |
| `REFRESH_TOKEN_EXPIRES_IN` | No | Default: `90d` |
| `EMAIL_HOST` | Yes | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | No | Default: `587` |
| `EMAIL_USER` | Yes | SMTP username |
| `EMAIL_PASS` | Yes | SMTP password |
| `EMAIL_FROM` | No | Default: `FaithCare <noreply@faithcare.app>` |
| `PORT` | No | Default: `3000` (not used on Vercel) |
| `NODE_ENV` | No | `development` \| `production` |

---

## 13. Deployment

### Vercel (Primary)

```
vercel.json
  buildCommand: npm run build          → nest build --webpack
  rewrites: /(.*) → /api/index
  functions/api/index.js: maxDuration 30s

api/index.js
  module.exports = require('../dist/lambda').default
```

**Build output:** `dist/lambda.js` (single webpack bundle, all `src/` aliases resolved)

**Key constraints:**
- No `process.exit()` — crashes the function container
- Swagger static assets must come from CDN (`unpkg.com/swagger-ui-dist@5.31.0`)
- MongoDB connection uses `serverSelectionTimeoutMS: 3000` to fail fast if Atlas unreachable

### Local / Render / Railway

```bash
npm run build        # nest build --webpack → dist/main.js + dist/lambda.js
npm run start:prod   # node dist/main.js
```

`@nestjs/cli` is in `dependencies` (not `devDependencies`) so it is available when `NODE_ENV=production` during platform builds.

### API Documentation

Available at `/api/v1/docs` — Swagger UI loaded from CDN, sorted alphabetically, with persistent authorization.
Raw OpenAPI JSON: `/api/v1/openapi.json`
