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

## Google Sign-In on phone

**Expo Go cannot use Google sign-in.** Google only allows `https://` redirect URIs on Web OAuth clients — `exp://192.168.x.x:8081` is rejected (you will see “Invalid redirect” in Google Cloud Console).

| Where you test | Google sign-in |
|----------------|----------------|
| Website | Works — Web OAuth client |
| Expo Go on phone | Use **email + password**, or log in on the website |
| Dev build on phone (`npx expo run:android`) | Works — needs Android OAuth client |

### Set up Google for a dev build (Android)

1. **Google Cloud Console** → APIs & Services → Credentials → **Create credentials** → **OAuth client ID**
2. Application type: **Android** (not Web)
3. Package name: `com.moonsjob.app`
4. SHA-1 fingerprint (debug keystore on Windows):

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA-1** line into Google Cloud Console.

5. Copy the new **Android client ID** into `apps/mobile/.env`:

```env
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
```

6. Keep `EXPO_PUBLIC_GOOGLE_CLIENT_ID` as your existing **Web** client ID (same as website).

7. Build and install on your phone (not Expo Go):

```bash
cd apps/mobile
npx expo run:android
```

OAuth consent screen → **Test users**: add your Gmail if the app is still in **Testing**.

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
