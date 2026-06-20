import { Platform } from 'react-native';
import Constants from 'expo-constants';

function defaultDevApiUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  defaultDevApiUrl();

export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');
