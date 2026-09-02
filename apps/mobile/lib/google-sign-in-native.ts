import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ID } from '@/lib/config';

let configured = false;

export function ensureNativeGoogleSignInConfigured() {
  if (configured || !GOOGLE_CLIENT_ID) return;

  GoogleSignin.configure({
    webClientId: GOOGLE_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

export async function signInWithNativeGoogle(): Promise<
  { idToken: string } | { cancelled: true } | { error: string }
> {
  if (!GOOGLE_CLIENT_ID) {
    return { error: 'Google sign-in is not configured in this build.' };
  }

  try {
    ensureNativeGoogleSignInConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { cancelled: true };
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return { error: 'Google sign-in failed — no token received.' };
    }

    return { idToken };
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        return { cancelled: true };
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        return { error: 'Google sign-in is already in progress.' };
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'Google Play Services is required for sign-in. Update it and try again.' };
      }
    }

    return { error: 'Google sign-in failed. Try again.' };
  }
}
