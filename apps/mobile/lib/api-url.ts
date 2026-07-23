import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = '3001';
const API_PATH = '/api/v1';

function buildApiUrl(host: string): string {
  return `http://${host}:${API_PORT}${API_PATH}`;
}

/** Metro / Expo dev server host, e.g. 192.168.0.104 from 192.168.0.104:8081 */
function getDevServerHost(): string | null {
  const raw =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri ??
    (Constants.manifest2?.extra?.expoGo?.debuggerHost as string | undefined);

  if (!raw || typeof raw !== 'string') return null;
  const host = raw.split(':')[0]?.trim();
  return host || null;
}

function resolveDevApiUrl(): string {
  // Android emulator cannot reach the PC via LAN IP — use the emulator gateway.
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return buildApiUrl('10.0.2.2');
  }

  // iOS simulator — localhost reaches the host machine.
  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return buildApiUrl('localhost');
  }

  // Physical device (Expo Go) or LAN dev — match Metro's host so API stays reachable.
  const devHost = getDevServerHost();
  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return buildApiUrl(devHost);
  }

  if (Platform.OS === 'web') {
    return buildApiUrl('localhost');
  }

  return Platform.OS === 'android' ? buildApiUrl('10.0.2.2') : buildApiUrl('localhost');
}

function resolveApiUrl(): string {
  const configured =
    process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra?.apiUrl as string | undefined);

  if (!__DEV__) {
    // Store / release builds must hit the production API (never localhost).
    return configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')
      ? configured
      : 'https://api.moonsjob.com/api/v1';
  }

  const devHost = getDevServerHost();

  // In dev on a physical device, always follow Metro's LAN IP (fixes stale .env IPs).
  if (Constants.isDevice && devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return buildApiUrl(devHost);
  }

  if (configured) {
    // localhost in .env on a LAN-connected phone → swap to Metro host.
    if (
      devHost &&
      devHost !== 'localhost' &&
      devHost !== '127.0.0.1' &&
      (configured.includes('localhost') || configured.includes('127.0.0.1'))
    ) {
      return buildApiUrl(devHost);
    }

    // Stale LAN IP in .env (e.g. .111 while Metro is on .104) → use Metro host.
    const configuredHost = configured.match(/^https?:\/\/([^:/]+)/)?.[1];
    if (
      configuredHost &&
      devHost &&
      configuredHost !== devHost &&
      /^\d+\.\d+\.\d+\.\d+$/.test(configuredHost) &&
      /^\d+\.\d+\.\d+\.\d+$/.test(devHost)
    ) {
      return buildApiUrl(devHost);
    }

    return configured;
  }

  return resolveDevApiUrl();
}

export const API_URL = resolveApiUrl();
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

if (__DEV__) {
  console.log('[MoonsJob] API_URL =', API_URL);
}
