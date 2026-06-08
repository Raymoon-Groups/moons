# Step 0 — Product & Architecture Decisions

**Project:** Moons  
**Started:** 2026-06-05  
**Completed:** 2026-06-05  
**Status:** ✅ **Complete** — locked for v1 web build

---

## Step 0 completion checklist

Planning-only items for this step (implementation is Step 1+):

- [x] v1 product goal and one-line scope defined
- [x] User roles (candidate, recruiter) defined
- [x] v1 user flows ordered (7 flows)
- [x] v1 web screen map (11 routes)
- [x] In-scope vs out-of-scope features listed
- [x] v1 success criteria defined (for later verification)
- [x] Backend shape chosen (modular monolith)
- [x] Local infrastructure scope defined (PG + Redis only)
- [x] Core database entities defined
- [x] Auth approach defined (JWT + Redis refresh)
- [x] Tech stack locked (pnpm, Turborepo, NestJS, Prisma, Next.js)
- [x] Landing page UX direction locked (job portal, Naukri-inspired)
- [x] API v1 endpoint contract defined
- [x] Application status workflow defined

---

## Decision 1 — v1 Product Slice

### One-line goal

A candidate can **sign up, build a basic profile, browse jobs, and apply**; a recruiter can **sign up, post jobs, and see who applied**.

### User roles (v1)

| Role       | Can do in v1                                              |
|------------|-----------------------------------------------------------|
| Candidate  | Register, edit profile, browse jobs, apply, track apps  |
| Recruiter  | Register, post/edit jobs, view applicants per job       |

Admin and company-team roles are **out of scope** for v1.

### v1 user flows (in build order)

```
1. Register / Login
2. Edit profile (name, headline, location, skills)
3. Recruiter → Create job
4. Anyone → Job list + job detail
5. Candidate → Apply to job
6. Candidate → My applications
7. Recruiter → My jobs + applicants list
```

### v1 screens (web)

| Route              | Purpose                                      | Build phase |
|--------------------|----------------------------------------------|-------------|
| `/`                | Job portal landing (search-first, Naukri-style) | Step 1 UI ✅ |
| `/login`           | Login                                        | Step 2      |
| `/register`        | Register (pick role)                         | Step 2      |
| `/dashboard`       | Role-based home                              | Step 3      |
| `/profile`         | View & edit own profile                      | Step 2      |
| `/jobs`            | Job listings + basic filters                 | Step 2      |
| `/jobs/[id]`       | Job detail + apply CTA                       | Step 3      |
| `/applications`    | Candidate: my applications                   | Step 3      |
| `/recruiter/jobs`  | Recruiter: my posted jobs                    | Step 3      |
| `/recruiter/jobs/new` | Recruiter: create job                     | Step 3      |
| `/recruiter/jobs/[id]/applicants` | Recruiter: applicants        | Step 3      |

### In scope (v1)

- Email + password authentication
- JWT access token + refresh token (Redis-backed)
- Basic profile (no resume upload yet — text fields only)
- Job CRUD for recruiters
- Job list with SQL filters (title, location, keyword in description)
- Job application with status pipeline (see Decision 5)
- Responsive Tailwind UI (desktop-first, mobile-friendly)
- Job portal landing page with mock listings until API is wired

### Explicitly out of scope (v1)

| Feature                | Defer to   |
|------------------------|------------|
| Social feed & posts    | v2         |
| Connections / network  | v2         |
| Real-time chat         | v2         |
| Company pages          | v2         |
| Resume file upload     | v2 (S3)    |
| OpenSearch             | v2         |
| Kafka / events         | v2         |
| Email / push notifications | v2   |
| AI (match, summaries)  | v3         |
| Mobile app             | After web v1 |
| Microservices split    | After v1 scale pain |
| AWS / EKS production   | After local v1 works |

### v1 success criteria (verify at end of v1 — not Step 0)

- [ ] New user can register as candidate or recruiter in under 2 minutes
- [ ] Recruiter can publish a job visible on `/jobs`
- [ ] Candidate can apply once per job (no duplicate applications)
- [ ] Recruiter can see applicant list for their job
- [ ] All flows work against local API + PostgreSQL (Docker)

---

## Decision 2 — Backend Shape for v1

### Choice: **Modular monolith** (single NestJS API)

One deployable NestJS application with clear modules. Extract to microservices only when a module has independent scaling or team ownership needs.

```
services/api/
├── src/
│   ├── auth/           # register, login, JWT, guards
│   ├── users/          # user entity, roles
│   ├── profiles/       # candidate/recruiter profile data
│   ├── jobs/           # job postings CRUD + list/filter
│   ├── applications/   # apply, list, status updates
│   ├── common/         # filters, pipes, decorators, guards
│   ├── prisma/         # Prisma service + module
│   └── redis/          # Redis service for refresh tokens
├── prisma/
│   └── schema.prisma
```

### Why not microservices now

- Faster iteration for a solo/small team
- One database transaction boundary for apply flow
- Simpler local dev (one API process, one migration set)
- Matches future split: each module becomes a service later

### v1 infrastructure (local only)

| Component   | v1 usage                               |
|-------------|----------------------------------------|
| PostgreSQL  | All persistent data                    |
| Redis       | Refresh tokens, optional rate limiting |
| NestJS API  | Port `3001`, prefix `/api/v1`          |
| Next.js web | Port `3000`                            |

**Not in v1 docker-compose:** Kafka, OpenSearch, S3, Socket.IO.

### API style

- REST JSON under `/api/v1/`
- OpenAPI (Swagger) at `/api/docs`
- Shared TypeScript types in `packages/shared`

### Core entities (v1 schema)

```
users          id, email, password_hash, role, created_at
profiles       user_id, full_name, headline, location, skills[]
jobs           id, recruiter_id, title, company_name, description,
               location, employment_type, status, created_at
applications   id, job_id, candidate_id, status, cover_note, created_at
```

### Auth approach (v1)

- Email + password only (no OAuth in v1)
- `accessToken` (15m) in `Authorization: Bearer` header
- `refreshToken` (7d) in httpOnly cookie `moons_refresh`, stored in Redis
- Role guard: `@Roles('RECRUITER')` on recruiter-only endpoints

---

## Decision 3 — Supporting tech choices (locked)

| Question        | Decision                                      |
|-----------------|-----------------------------------------------|
| App / brand     | **Moons** (display: moons jobs on landing)    |
| Monorepo        | **pnpm workspaces + Turborepo**               |
| ORM             | **Prisma** + PostgreSQL                       |
| UI              | **Tailwind CSS** (+ shadcn/ui when building forms in Step 2) |
| Data fetching   | **TanStack Query** on web                     |
| Forms (later)   | **React Hook Form + Zod**                     |
| Priority        | **Jobs first**; profile supports apply flow   |
| Web framework   | **Next.js App Router** (v16 in repo)          |
| Mobile          | **Deferred** until web v1 ships               |

---

## Decision 4 — Landing page UX (locked)

The home page `/` is a **job portal landing**, not a generic marketing website.

| Element              | Direction                                              |
|----------------------|--------------------------------------------------------|
| Layout               | Search-first hero, full-width stacked sections         |
| Visual reference     | Naukri-inspired (not a copy): blue + orange, job-focused |
| Hero                 | Skills + location + experience search, orange CTA      |
| Below fold           | Stats, categories, trending jobs, companies, cities    |
| Data on landing      | Mock job data until `/jobs` is wired to API (Step 2)   |
| Header               | Jobseeker / Employer login strip + Register Free       |

---

## Decision 5 — API v1 contract & application workflow

### REST endpoints (v1)

| Method | Path | Auth | Role | Purpose |
|--------|------|------|------|---------|
| POST | `/auth/register` | — | — | Register candidate or recruiter |
| POST | `/auth/login` | — | — | Login |
| POST | `/auth/refresh` | cookie | — | Refresh access token |
| POST | `/auth/logout` | JWT | any | Logout |
| GET | `/profiles/me` | JWT | any | Get own profile |
| PATCH | `/profiles/me` | JWT | any | Update profile |
| GET | `/jobs` | — | — | List published jobs (filters: q, location) |
| GET | `/jobs/:id` | — | — | Job detail |
| POST | `/jobs` | JWT | recruiter | Create job |
| GET | `/jobs/mine` | JWT | recruiter | Recruiter's jobs |
| POST | `/applications` | JWT | candidate | Apply to job |
| GET | `/applications/mine` | JWT | candidate | My applications |
| GET | `/applications/job/:jobId` | JWT | recruiter | Applicants for a job |
| PATCH | `/applications/:id/status` | JWT | recruiter | Update application status |

### Application status flow

```
SUBMITTED → VIEWED → SHORTLISTED
                  └→ REJECTED
```

- One application per `(job_id, candidate_id)` — enforced by DB unique constraint
- Recruiter can move status forward; candidate read-only on status

### Job status (v1)

- `DRAFT` — not listed publicly (optional v1; default publish as `PUBLISHED`)
- `PUBLISHED` — visible on `GET /jobs`
- `CLOSED` — hidden from public list

---

## Decision 6 — Repo layout (locked)

```
moons/
├── apps/web/              # Next.js frontend
├── services/api/          # NestJS modular monolith
├── packages/shared/       # Shared TypeScript types
├── docs/                  # Step 0 decisions, future ADRs
├── docker-compose.yml     # PostgreSQL + Redis
├── .env.example           # Root env template
└── turbo.json
```

Future (not Step 0): `infra/`, `apps/mobile/`, split `services/*` microservices.

---

## What Step 1 builds next

1. Finish monorepo install, migrations, runnable API + DB
2. Wire landing search → `/jobs` page
3. Auth pages (`/login`, `/register`) connected to API
4. Remaining v1 screens per flow order above

---

## How to change a decision

Edit this file and add a dated note under **Changelog**. Do not silently drift — v1 scope creep is the main risk.

### Changelog

| Date       | Change |
|------------|--------|
| 2026-06-05 | Initial Step 0 decisions locked |
| 2026-06-05 | Step 0 marked complete: landing UX, API contract, application workflow, repo layout, screen build phases |
