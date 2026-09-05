import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const INTRO_SEEN_KEY = 'moons_intro_seen_v3';
const isWeb = Platform.OS === 'web';

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

export async function getIntroSeen(): Promise<boolean> {
  const value = await getItem(INTRO_SEEN_KEY);
  return value === '1';
}

export async function setIntroSeen(): Promise<void> {
  await setItem(INTRO_SEEN_KEY, '1');
}
