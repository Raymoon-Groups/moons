import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

function keyForUser(userId: string) {
  return `moons_network_badge_ack_${userId}`;
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getAckedNetworkPendingCount(userId: string): Promise<number> {
  const value = await getItem(keyForUser(userId));
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function setAckedNetworkPendingCount(userId: string, count: number): Promise<void> {
  await setItem(keyForUser(userId), String(Math.max(0, count)));
}
