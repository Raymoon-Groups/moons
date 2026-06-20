# MoonsJob Mobile (Expo + React Native)

Native iOS/Android app for MoonsJob. Lives in the **same monorepo** as web and API — not a separate repo.

```
moons/
├── apps/web       → Website (Next.js)
├── apps/mobile    → Mobile app (this folder)
├── services/api   → Shared backend
└── packages/shared → Shared TypeScript types
```

## Prerequisites

- Node.js 20+
- pnpm
- API running (`pnpm dev` from repo root, or API only on port 3001)
- [Expo Go](https://expo.dev/go) on your phone, or Android Studio / Xcode emulator

## Setup

From the **repo root**:

```bash
pnpm install
```

Copy env (optional — defaults work for emulators):

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

## Run

**Terminal 1 — API + web (or API only):**

```bash
pnpm dev
```

**Terminal 2 — Mobile:**

```bash
pnpm mobile
```

Then press:
- `a` — Android emulator
- `i` — iOS simulator (Mac only)
- Scan QR — Expo Go on physical device

## API URL for devices

| Where you run the app | API URL |
|----------------------|---------|
| iOS Simulator | `http://localhost:3001/api/v1` |
| Android Emulator | `http://10.0.2.2:3001/api/v1` (auto) |
| Physical phone | `http://YOUR_PC_IP:3001/api/v1` |

Set in `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001/api/v1
```

Make sure your phone and PC are on the same Wi‑Fi, and Windows firewall allows port 3001.

## What's included (MVP)

- Login with email/password
- Browse jobs list
- Job detail + apply (candidates)
- Profile tab + logout
- Secure token storage (Expo SecureStore)
- Shares `@moons/shared` types with web

## Production

Set `EXPO_PUBLIC_API_URL=https://api.moonsjob.com/api/v1` when building for App Store / Play Store.

Build with [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
cd apps/mobile
npx eas build --platform android
npx eas build --platform ios
```

## Next steps (not built yet)

- Register / OTP flow
- Google Sign-In
- Recruiter job management
- Push notifications
- Profile editing
