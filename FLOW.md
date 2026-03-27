# FaithCare Backend — Implementation Flow Document

> A plain-language walkthrough of every user journey implemented in the backend —
> from first registration through all in-app features, including all edge cases.

---

## Table of Contents

1. [User Registration & Email Verification](#1-user-registration--email-verification)
2. [Login](#2-login)
3. [Token Refresh](#3-token-refresh)
4. [Onboarding — User Metadata](#4-onboarding--user-metadata)
5. [Organization Setup (ADMIN / SUPER_ADMIN Only)](#5-organization-setup-admin--super_admin-only)
6. [Switching into an Organization Context](#6-switching-into-an-organization-context)
7. [Membership Management](#7-membership-management)
8. [First-Timer / Church Care Flow](#8-first-timer--church-care-flow)
9. [Follow-Up & Church Dashboard](#9-follow-up--church-dashboard)
10. [Prayer Requests (Org-Level)](#10-prayer-requests-org-level)
11. [Salvation Records](#11-salvation-records)
12. [Communities](#12-communities)
13. [Journal](#13-journal)
14. [Daily Scripture](#14-daily-scripture)
15. [Focus Timer](#15-focus-timer)
16. [Prime Church — Public Forms (No Auth)](#16-prime-church--public-forms-no-auth)
17. [Health Check](#17-health-check)
18. [Role & Permission Summary](#18-role--permission-summary)
19. [Error & Edge Case Reference](#19-error--edge-case-reference)

---

## 1. User Registration & Email Verification

### Normal Path

```
Client                          Backend
  │                               │
  │  POST /auth/register          │
  │  { fullName, email, password }│
  │ ──────────────────────────────►
  │                               │  1. Check if email is already registered
  │                               │     → if yes: 409 Conflict
  │                               │  2. Hash password (bcrypt, salt: 12)
  │                               │  3. Create User record
  │                               │     { role: USER, isEmailVerified: false }
  │                               │  4. Generate 6-digit OTP, hash it (bcrypt, salt: 10)
  │                               │  5. Save OTP to DB (expires in 10 min)
  │                               │  6. Send OTP to email via EmailService
  │  ◄──────────────────────────────
  │  200 { message: "Check your email for the verification OTP" }
  │
  │  POST /auth/verify-email      │
  │  { email, otp }               │
  │ ──────────────────────────────►
  │                               │  1. Find OTP record:
  │                               │     { email, type: email_verification, used: false,
  │                               │       expiresAt > now }
  │                               │     → if not found: 400 "OTP is invalid or has expired"
  │                               │  2. bcrypt.compare(otp, hashedOtp)
  │                               │     → if mismatch: 400 "OTP is invalid or has expired"
  │                               │  3. Mark OTP as used: true
  │                               │  4. Set user.isEmailVerified = true
  │                               │  5. Send welcome email
  │                               │  6. Sign access + refresh tokens
  │  ◄──────────────────────────────
  │  200 { accessToken, refreshToken, user }
```

### Edge Cases

| Scenario | What Happens |
|---------|-------------|
| Email already registered | `POST /auth/register` → 409 Conflict |
| OTP expired (> 10 min) | `POST /auth/verify-email` → 400 "OTP is invalid or has expired" |
| Wrong OTP entered | Same 400 error (bcrypt mismatch) |
| OTP already used | Same 400 — `used: false` filter excludes it |
| Resend OTP | `POST /auth/resend-otp { email, type: "email_verification" }` — deletes all previous unused OTPs for that email+type, creates a fresh one |
| User not found on resend | 404 Not Found |

---

## 2. Login

```
Client                          Backend
  │                               │
  │  POST /auth/login             │
  │  { email, password }          │
  │ ──────────────────────────────►
  │                               │  1. Find user by email (isDeleted: false)
  │                               │     → if not found: 401 "Invalid credentials"
  │                               │  2. bcrypt.compare(password, user.password)
  │                               │     → if mismatch: 401 "Invalid credentials"
  │                               │  3. Check isEmailVerified
  │                               │     → if false:
  │                               │         resend OTP to email
  │                               │         401 "Email not verified. A new OTP has been sent."
  │                               │  4. Sign global access token (8h) + refresh token (90d)
  │                               │     payload: { sub, email, role }
  │  ◄──────────────────────────────
  │  200 { accessToken, refreshToken, tokenType: Bearer,
  │        expiresIn: 28800, user: { id, name, email, role } }
```

**The `role` in the response tells the client what level of access to render:**
- `USER` → regular app member (default for all registrations)
- `ADMIN` → org/platform admin (manually assigned by SUPER_ADMIN)
- `SUPER_ADMIN` → full platform access (manually assigned)

### Edge Cases

| Scenario | What Happens |
|---------|-------------|
| Soft-deleted account | 401 "Invalid credentials" (filtered out by `isDeleted: false`) |
| Email not verified | OTP resent automatically + 401 with message |
| Wrong password | 401 "Invalid credentials" (same message — no email enumeration) |
| Google OAuth | `GET /auth/google` → placeholder (requires Google credentials to activate) |

---

## 3. Token Refresh

```
  POST /auth/refresh  { refreshToken }
    → Verify with REFRESH_TOKEN_SECRET
    → Load user by sub (from token payload)
    → Issue new access token (8h)
    → 401 if token invalid/expired
```

---

## 4. Onboarding — User Metadata

After login, the client may optionally create or update a `UserMetaData` record that stores profile preferences.

```
POST /users/metadata                 (USER only)
  { userId, location, spiritualGoals, ... }
  → Creates the metadata record (1:1 with User)

GET  /users/metadata/user/:userId    (USER only)
  → Returns metadata with organization fully populated

PATCH /users/metadata/:id            (USER only)
  → Updates metadata fields
```

### Church Affiliation

A user can connect their profile to a church in two ways:

```
PATCH /users/metadata/me/church      (USER only)
  Body (only ONE of):
    { organization: "<orgId>" }    ← church found via search (ObjectId)
    { churchName: "Grace Chapel" } ← free text if not in system

  Rules:
  - Providing both fields → 400 Bad Request
  - Providing neither     → 400 Bad Request
  - organization provided → sets organization ref, clears churchName
  - churchName provided   → sets churchName string, clears organization ref

  Returns the updated metadata with organization populated (full org object)
```

### Edge Cases

| Scenario | What Happens |
|---------|-------------|
| Both `organization` and `churchName` sent | 400 Bad Request |
| Neither field sent | 400 Bad Request |
| Metadata record doesn't exist yet | 404 Not Found |
| Switching from named church to org | `organization` set, `churchName` set to null |
| Switching from org to named church | `churchName` set, `organization` set to null |

---

## 5. Organization Setup (ADMIN / SUPER_ADMIN Only)

Only users with role `ADMIN` or `SUPER_ADMIN` can create an organization. This is the entry point to the multi-tenant system.

```
Client                          Backend
  │                               │
  │  POST /organizations          │
  │  { name, email, denomination, │
  │    address, city, state,      │
  │    zipCode, phoneNumber,      │
  │    memberCountRange,          │
  │    organizationRole }         │
  │ ──────────────────────────────►
  │  (requires ADMIN/SUPER_ADMIN) │
  │                               │  1. Generate slug from name (or use provided slug)
  │                               │     e.g. "Prime Church Lagos" → "prime-church-lagos"
  │                               │     → if slug taken: 409 Conflict
  │                               │  2. Create Organization record
  │                               │  3. Generate first-timer QR code (Base64 PNG)
  │                               │     QR encodes: { organizationId, slug, name }
  │                               │  4. Save QR code on the org record
  │                               │  5. Create Membership record for creator:
  │                               │     { role: OWNER, status: ACTIVE,
  │                               │       organizationRole: <from dto> }
  │  ◄──────────────────────────────
  │  201 { org object + firstTimerQrCode }
```

**What `organizationRole` means:** this is the creator's *church title* (e.g. `SENIOR_PASTOR`, `CHURCH_ADMIN`). It is informational only — access is controlled by `MembershipRole` (`OWNER`/`ADMIN`/`MEMBER`), not by this title.

**Role note:** Creating an org does **not** change the creator's platform role. The creator must already be `ADMIN` or `SUPER_ADMIN` to reach this endpoint. Role assignment is managed separately by a `SUPER_ADMIN`.

### QR Code

The `firstTimerQrCode` field on the Organization is a Base64 PNG data URI. It can be:
- Displayed as an `<img src="...">` or printed for physical display at the church entrance
- Scanned by first-time visitors to pre-fill the registration form

To regenerate after a name/slug change:
```
POST /organizations/:id/qr-code/regenerate  (ADMIN/SUPER_ADMIN only)
  → Returns new { firstTimerQrCode }
```

### Other Organization Operations

| Action | Endpoint | Access |
|--------|---------|--------|
| Create org | `POST /organizations` | ADMIN / SUPER_ADMIN |
| List user's orgs | `GET /organizations/mine` | All authenticated |
| Find by slug | `GET /organizations/slug/:slug` | ADMIN / SUPER_ADMIN |
| Find by ID | `GET /organizations/:id` | All authenticated |
| Update org | `PATCH /organizations/:id` | ADMIN / SUPER_ADMIN |
| Delete org | `DELETE /organizations/:id` (soft delete) | ADMIN / SUPER_ADMIN |
| Regenerate QR | `POST /organizations/:id/qr-code/regenerate` | ADMIN / SUPER_ADMIN |

---

## 6. Switching into an Organization Context

A global token does not give access to org-protected routes. The client must exchange it for an org-scoped token first.

```
Client                          Backend
  │                               │
  │  POST /auth/switch-organization/:organizationId
  │  Authorization: Bearer <global_token>
  │ ──────────────────────────────►
  │                               │  1. Find Membership where:
  │                               │     { userId, organization: orgId, status: ACTIVE }
  │                               │     → if not found: 401 "Not an active member"
  │                               │  2. Load user record
  │                               │  3. Sign new access token with org context:
  │                               │     { sub, email, role,
  │                               │       activeOrganizationId,
  │                               │       activeOrganizationRole }
  │  ◄──────────────────────────────
  │  200 { accessToken, activeOrganizationId, activeOrganizationRole }
```

**From this point, all tenant-protected requests must use the org-scoped token.**

`TenantGuard` (on protected routes) validates on every request:
1. `activeOrganizationId` exists in JWT
2. JWT org ID matches the `:organizationId` route param
3. Live DB check: membership is still `ACTIVE` (catches post-issuance revocations)

---

## 7. Membership Management

All routes under `/organizations/:organizationId/members` require a valid org-scoped token.

### List Members

```
GET /organizations/:organizationId/members   (All authenticated org members)
  → Returns paginated member list
```

### Invite a Member

```
POST /organizations/:organizationId/members/invite   (ADMIN / SUPER_ADMIN only)
  { email, role? }    ← role defaults to MEMBER

  Flow:
  1. Find user by email → 404 if not found
  2. Check for existing membership:
     - ACTIVE already    → 409 Conflict
     - Previously suspended → re-activate with new role
     - No record         → create new ACTIVE membership
```

### Update a Member's Role

```
PATCH /organizations/:organizationId/members/:userId/role   (ADMIN / SUPER_ADMIN only)
  { role: OWNER | ADMIN | MEMBER }

  Rules:
  - Actor must be ADMIN or OWNER
  - Only OWNER can promote another to OWNER (ownership transfer)
  - MEMBER cannot update anyone's role
```

### Remove a Member

```
DELETE /organizations/:organizationId/members/:userId   (ADMIN / SUPER_ADMIN only)

  Rules:
  - Actor cannot remove themselves (use /leave instead)
  - Actor must be ADMIN or OWNER
  - Cannot remove the OWNER
  - Performs hard delete on the Membership record
```

### Leave an Organization

```
DELETE /organizations/:organizationId/members/leave   (ADMIN / SUPER_ADMIN only)

  Rules:
  - OWNER cannot leave (must transfer ownership first via role update, then leave)
  - All other roles: hard delete on own Membership
```

### Edge Cases

| Scenario | What Happens |
|---------|-------------|
| Invite email not registered | 404 Not Found |
| Invite already-active member | 409 Conflict |
| Invite previously suspended member | Re-activates them |
| USER tries to invite/modify members | 403 Forbidden (RolesGuard blocks) |
| MEMBER tries to update role | 403 Insufficient permissions |
| Non-OWNER tries to assign OWNER | 403 Insufficient permissions |
| OWNER tries to leave | 403 "Transfer ownership first" |
| Try to remove OWNER | 403 "Cannot remove the organization owner" |
| Remove self | 403 "Use /leave to leave an organization" |

---

## 8. First-Timer / Church Care Flow

### How First-Timers Register (QR Scan)

```
Visitor scans QR code at church entrance
  → QR decodes to: { organizationId, slug, name }
  → Public form pre-filled with org context

  POST /church/first-timers   (Public — no auth)
  { organizationId, name, phoneNumber, email?,
    prayerRequest?, visitType, serviceDate?, notes? }

  Backend:
  1. Create FirstTimer record
     { organizationId, status: PENDING,
       followUpScheduledAt: now + 3 days }
  2. Return created record
```

### Second-Timer Registration

```
  POST /church/first-timers
  { ...same fields, visitType: "second_time", firstTimerId: <original record> }

  → Links the second visit back to the original FirstTimer record
```

### Staff Managing First-Timers

| Action | Endpoint | Auth |
|--------|---------|------|
| List (paginated, filterable) | `GET /church/first-timers?page&limit&status&visit_type&search&from_date&to_date` | JWT |
| Export CSV/Excel | `GET /church/first-timers/export` | JWT |
| Get one record | `GET /church/first-timers/:id` | JWT |
| Update status/notes | `PATCH /church/first-timers/:id/status` | JWT |

### Status Lifecycle

```
PENDING  ──► CONTACTED  ──► FOLLOWED_UP
```

---

## 9. Follow-Up & Church Dashboard

All follow-up routes require `ADMIN` or `SUPER_ADMIN` role.

### Follow-Up Tasks

Auto-created when a first-timer is registered (`followUpScheduledAt` = +3 days).
Staff can also manage follow-ups manually.

| Action | Endpoint | Access |
|--------|---------|--------|
| List by org | `GET /church/follow-up` (query by organizationId) | ADMIN / SUPER_ADMIN |
| List by first-timer | filter by `newMemberId` | ADMIN / SUPER_ADMIN |
| CRUD | Standard create/read/update/delete | ADMIN / SUPER_ADMIN |

### Follow-Up Templates

Message templates used to send follow-up communications.

| Field | Description |
|-------|-------------|
| `trigger` | When to send: `on_registration`, `day_3`, `day_7`, `manual` |
| `channel` | How to send: `whatsapp`, `email`, `sms` |
| `body` | Message with `{{variables}}` placeholders |

| Action | Endpoint |
|--------|---------|
| List templates | `GET /church/follow-up/templates` |
| Update template | `PUT /church/follow-up/templates/:id` |
| View message logs | `GET /church/follow-up/logs` |
| Trigger manual send | `POST /church/follow-up/send` |

> **Note:** WhatsApp and SMS delivery integrations are defined but no external provider is connected yet. Email delivery is active via `EmailService`.

### Dashboard Analytics

```
GET /church/dashboard/summary   → aggregate counts (first-timers, statuses, salvations, etc.)
GET /church/dashboard/trends    → week-on-week trend data
```

---

## 10. Prayer Requests (Org-Level)

Org-scoped prayer requests. Members can submit; ADMIN/SUPER_ADMIN manage them.

```
All routes require org-scoped token + TenantGuard

POST   /organizations/:organizationId/prayer-requests      (USER only — submit)
GET    /organizations/:organizationId/prayer-requests      (ADMIN / SUPER_ADMIN)
GET    /organizations/:organizationId/prayer-requests/:id  (ADMIN / SUPER_ADMIN)
PATCH  /organizations/:organizationId/prayer-requests/:id  (ADMIN / SUPER_ADMIN)
DELETE /organizations/:organizationId/prayer-requests/:id  (ADMIN / SUPER_ADMIN)
```

**Status lifecycle:**
```
PENDING  ──► CONTACTED  ──► FOLLOWED_UP
```

---

## 11. Salvation Records

Track decisions for Christ made during services. ADMIN/SUPER_ADMIN only.

```
All routes under /organizations/:organizationId/salvation-records
Standard CRUD — org-scoped, TenantGuard protected
Access: ADMIN / SUPER_ADMIN only

Status lifecycle:
PENDING  ──► CONTACTED  ──► FOLLOWED_UP
```

---

## 12. Communities

Sub-groups within an organization (e.g. small groups, cell groups).

```
All routes under /organizations/:organizationId/communities
Org-scoped, TenantGuard protected

Fields: name, description, members (User[] references), profileImage
```

| Action | Endpoint | Access |
|--------|---------|--------|
| Create community | `POST /organizations/:organizationId/communities` | ADMIN / SUPER_ADMIN |
| List all communities | `GET /organizations/:organizationId/communities` | ADMIN / SUPER_ADMIN |
| Get communities I belong to | `GET /organizations/:organizationId/communities/user` | USER (authenticated member) |
| Get recent members | `GET /organizations/:organizationId/communities/recent-members` | ADMIN / SUPER_ADMIN |
| Get community by ID | `GET /organizations/:organizationId/communities/:id` | All authenticated |
| Update community | `PATCH /organizations/:organizationId/communities/:id` | ADMIN / SUPER_ADMIN |
| Delete community | `DELETE /organizations/:organizationId/communities/:id` | ADMIN / SUPER_ADMIN |

**`GET /organizations/:organizationId/communities/user`** — returns only communities where the authenticated user is listed as a member (`members` array contains `user.sub`). Uses `@CurrentUser()` to extract the user ID from the JWT.

---

## 13. Journal

Personal sermon/devotional journaling. Scoped to the authenticated user — no org required.

```
All routes require global JWT (USER only — no org context needed)

POST   /journal/entries   { title, scriptureReference?, content }
GET    /journal/entries   ?page&limit&search&sort
GET    /journal/entries/:id
PUT    /journal/entries/:id
DELETE /journal/entries/:id

Entries are filtered by userId from the JWT — users can only see their own entries.
```

---

## 14. Daily Scripture

One scripture record per user per day. Includes optional reminder preferences.

```
GET    /scripture/today              → today's entry (All authenticated)

All other routes require ADMIN / SUPER_ADMIN:
POST   /scripture                    { title, scriptureReference, date, content }
GET    /scripture/user/:userId       → list entries for a user
GET    /scripture/:date              → get entry by date (YYYY-MM-DD)
PATCH  /scripture/reminder/preferences
PATCH  /scripture/:id
DELETE /scripture/:id
```

---

## 15. Focus Timer

Pomodoro-style 25-minute productivity sessions. On completion, the backend returns a scripture as a reward.

```
All routes require global JWT (USER only)

POST   /timer/sessions              → start a session (status: NOT_STARTED)
GET    /timer/sessions              → list user's sessions
GET    /timer/sessions/active       → get current in-progress session
GET    /timer/sessions/:id
PATCH  /timer/sessions/:id/complete → mark complete → returns scripture reward
PATCH  /timer/sessions/:id/pause    → pause session (saves currentProgress in seconds)
PATCH  /timer/sessions/:id          → general update
DELETE /timer/sessions/:id
```

**Status lifecycle:**
```
NOT_STARTED  ──► IN_PROGRESS  ──► COMPLETED
                     │
                     └──► CANCELLED
```

---

## 16. Prime Church — Public Forms (No Auth)

Three public endpoints for Prime Church's external web pages. No login required.
All records are automatically associated with Prime Church's hardcoded org ID (`69bd8cd5ec1a44c866c52113`).

### Workforce Application

```
POST /prime/workforce
  Accepts: JSON or application/x-www-form-urlencoded

  Required fields:
  - fullName, phoneNumber, email, address
  - haveServedInADepartment (boolean)
  - departmentToServeIn (one or more of):
      SOUND_TRYBE, USHERING_GREETERS_PROTOCOL, PRAYER_BIBLE_STUDY,
      PUBLICITY_OUTREACH, PROGRAMS, MEDIA_TECHNICAL,
      PROGRAMS_VENUE_MANAGEMENT, MEMBERSHIP, WELFARE_HOSPITALITY
```

### Trybe Application

```
POST /prime/trybe
  Accepts: JSON or application/x-www-form-urlencoded

  Required fields:
  - name, phoneNumber, email
  - gender:                MALE | FEMALE
  - isAMember:             YES | NO | NEW_MEMBER
  - skills (free text)
  - whatWouldYouLikeToDo:  JOIN | LEAD | JOIN_FIRST
  - whyWouldYouLikeToJoin  (free text)
  - whichTrybeCategoryToJoin: TECH | CAREER | CREATIVE | ENTREPRENEUR
```

### Prayer Request (Prime Public)

```
POST /prime/prayer-request
  Accepts: JSON or application/x-www-form-urlencoded

  Required fields:
  - name, email, prayerRequest

  Status defaults to: PENDING
```

---

## 17. Health Check

```
GET /health   (Public)
  → Pings MongoDB + returns process uptime
  → Used by Vercel and monitoring tools to verify the function is alive
```

---

## 18. Role & Permission Summary

### Platform Roles (on User record)

| Role | How Assigned | What It Unlocks |
|------|-------------|----------------|
| `USER` | Default on registration | Personal features: journal, focus timer, user metadata, connect to church, submit prayer requests, view own communities, view org by ID, view orgs they belong to, view members list |
| `ADMIN` | Manually assigned by SUPER_ADMIN | All USER features + full org management (create orgs, manage members, manage first-timers, salvation records, follow-ups, communities CRUD, most scripture endpoints) |
| `SUPER_ADMIN` | Manually assigned | Full platform access — all endpoints |

### Membership Roles (on Membership record — within an org)

| Role | How Assigned | What It Controls |
|------|-------------|-----------------|
| `OWNER` | Creator of the org | Everything; cannot leave without transferring ownership |
| `ADMIN` | Promoted by OWNER | Invite/remove/update non-owners |
| `MEMBER` | Default when invited | Read access only |

### Endpoint Access Matrix

| Module | Endpoint | USER | ADMIN | SUPER_ADMIN |
|--------|---------|:----:|:-----:|:-----------:|
| Auth | POST /auth/register | ✓ | ✓ | ✓ |
| Auth | POST /auth/login | ✓ | ✓ | ✓ |
| Auth | POST /auth/verify-email | ✓ | ✓ | ✓ |
| Auth | POST /auth/refresh | ✓ | ✓ | ✓ |
| Auth | POST /auth/switch-organization/:id | ✓ | ✓ | ✓ |
| Organizations | POST /organizations | ✗ | ✓ | ✓ |
| Organizations | GET /organizations/mine | ✓ | ✓ | ✓ |
| Organizations | GET /organizations/:id | ✓ | ✓ | ✓ |
| Organizations | GET /organizations/slug/:slug | ✗ | ✓ | ✓ |
| Organizations | PATCH/DELETE /organizations/:id | ✗ | ✓ | ✓ |
| Organizations | POST /organizations/:id/qr-code/regenerate | ✗ | ✓ | ✓ |
| Members | GET /organizations/:orgId/members | ✓ | ✓ | ✓ |
| Members | POST invite / PATCH role / DELETE | ✗ | ✓ | ✓ |
| Communities | POST/GET all/PATCH/DELETE | ✗ | ✓ | ✓ |
| Communities | GET /communities/user (own) | ✓ | ✓ | ✓ |
| Communities | GET /communities/:id | ✓ | ✓ | ✓ |
| Prayer Requests | POST (submit) | ✓ | ✓ | ✓ |
| Prayer Requests | GET/PATCH/DELETE (manage) | ✗ | ✓ | ✓ |
| Salvation Records | All CRUD | ✗ | ✓ | ✓ |
| Follow-Up | All CRUD | ✗ | ✓ | ✓ |
| User Metadata | All endpoints | ✓ | ✗ | ✗ |
| Users Module | All endpoints | ✗ | ✓ | ✓ |
| Org User Settings | All endpoints | ✗ | ✓ | ✓ |
| Journal | All endpoints | ✓ | ✗ | ✗ |
| Focus Timer | All endpoints | ✓ | ✗ | ✗ |
| Daily Scripture | GET /scripture/today | ✓ | ✓ | ✓ |
| Daily Scripture | All other endpoints | ✗ | ✓ | ✓ |
| Prime Forms | POST /prime/* | Public | Public | Public |
| Health | GET /health | Public | Public | Public |

### Guard Chain (every request)

```
Request
  ↓
@Public() present?  ──YES──►  Skip all auth guards, pass through
  ↓ NO
JwtAuthGuard  ──►  Verify Bearer token, attach user to request
  ↓
RolesGuard    ──►  Check @Roles() metadata; pass if no metadata
  ↓
TenantGuard   ──►  (only on org routes)
               1. activeOrganizationId in JWT?
               2. JWT org matches route :organizationId?
               3. Live DB check: membership ACTIVE?
  ↓
Route Handler
```

---

## 19. Error & Edge Case Reference

### Authentication Errors

| Code | Trigger |
|------|---------|
| 401 "Invalid credentials" | Wrong email, wrong password, or soft-deleted user |
| 401 "Email not verified. A new OTP has been sent." | Login before verifying email |
| 401 "Invalid or expired refresh token" | Bad or expired refresh token |
| 401 "You are not an active member of this organization" | switch-organization with no ACTIVE membership |
| 401 "Your session has expired. Please log in again." | Expired JWT |
| 401 "You are not logged in." | Missing JWT on protected route |
| 403 "Forbidden resource" | Authenticated but insufficient role (RolesGuard) |

### Registration & OTP Errors

| Code | Trigger |
|------|---------|
| 409 "Email already registered" | Duplicate email on register |
| 400 "OTP is invalid or has expired" | Wrong OTP, used OTP, or expired OTP |
| 404 "User not found" | resend-otp for non-existent email |

### Organization Errors

| Code | Trigger |
|------|---------|
| 403 "Forbidden resource" | USER tries to create/update/delete an org |
| 409 "Slug is already taken" | Org name collision on create |
| 403 "Transfer ownership before leaving" | OWNER trying to leave |
| 403 "Cannot remove the organization owner" | Trying to remove OWNER |
| 403 "Use /leave to leave an organization" | Trying to remove yourself |
| 403 "Insufficient permissions to assign this role" | MEMBER tries to update role; non-OWNER tries to assign OWNER |
| 403 "Access denied" | No active membership when performing member actions |
| 403 from TenantGuard | Org ID mismatch or membership revoked |
| 404 "Member not found in this organization" | Target user not a member |

### Metadata / Church Errors

| Code | Trigger |
|------|---------|
| 400 "Provide either organization or churchName" | Both or neither sent to `PATCH /users/metadata/me/church` |
| 400 "Provide only one of organization or churchName, not both" | Both fields sent |
| 404 "User metadata not found" | connectToChurch called before metadata record exists |

### Soft Delete Behavior

All entities with `BaseSchema` use soft delete:
- `DELETE` endpoints set `isDeleted: true` and `deletedAt: now`
- All `findAll` / `findOne` queries automatically filter `{ isDeleted: false }`
- Data is never permanently lost via normal API operations
- `restore()` is available on `BaseRepository` for recovery

---

*This document reflects the state of the codebase as of the latest commit. For schema details and entity relationships, see [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md). For system architecture and design decisions, see [ARCHITECTURE.md](ARCHITECTURE.md).*
