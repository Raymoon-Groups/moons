export { API_URL, API_ORIGIN } from './api-url';

/** Web OAuth client ID — used for token exchange and as fallback on native. */
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

/** Android OAuth client ID — create in Google Cloud (Android app, not Web). */
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

/** iOS OAuth client ID — create in Google Cloud (iOS app, not Web). */
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export { colors, theme } from './theme';
export { useTheme } from './theme-context';
