# Moons — Local Development

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- **Docker Desktop** (PostgreSQL + Redis)

## Setup

```bash
pnpm install
pnpm db:up          # requires Docker
pnpm db:migrate
pnpm db:seed
```

## Run

```bash
# Terminal 1 — API
pnpm --filter @moons/api dev

# Terminal 2 — Web
pnpm --filter @moons/web dev
```

## URLs

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/api/docs |

## Demo accounts (after seed)

| Email | Password |
|-------|----------|
| candidate@moons.com | password123 |
| recruiter@moons.com | password123 |
