import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { signInWithGoogleToken } from './auth';
import { GOOGLE_WEB_CLIENT_ID } from './googleConfig';
import type { User } from './types';

let configured = false;

// Opens the Google account picker. Returns the Vicinia user, or null if the person closed the picker.
export async function signInWithGoogle(): Promise<User | null> {
  if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID.startsWith('PASTE')) throw { code: 'auth/google-not-configured' };
  if (!configured) {
    // The iOS client ID is read from GoogleService-Info.plist automatically.
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    configured = true;
  }
  try {
    try { await GoogleSignin.signOut(); } catch { /* nothing to sign out */ } // always show the account picker
    const res: any = await GoogleSignin.signIn(); // newer versions: { type, data }, older: the user object
    if (res?.type === 'cancelled') return null;
    const idToken: string | undefined = res?.data?.idToken ?? res?.idToken;
    if (!idToken) throw { code: 'auth/google-failed' };
    const sdkPhoto: string | undefined = res?.data?.user?.photo ?? res?.user?.photo ?? undefined; // Google account's profile picture
    return await signInWithGoogleToken(idToken, sdkPhoto);
  } catch (e: any) {
    if (e?.code === statusCodes.SIGN_IN_CANCELLED || e?.code === statusCodes.IN_PROGRESS) return null;
    throw e;
  }
}
