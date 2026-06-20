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
# Web + API (from repo root)
pnpm dev

# Mobile app (separate terminal — see apps/mobile/README.md)
pnpm mobile
```

## URLs

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/api/docs |
| Mobile | Expo dev server (`pnpm mobile`) |

## Demo accounts (after seed)

| Email | Password |
|-------|----------|
| candidate@moons.com | password123 |
| recruiter@moons.com | password123 |
