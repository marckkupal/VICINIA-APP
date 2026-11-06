import { firebaseConfig } from './firebase';
import type { User } from './types';
import { isAllowedEmail, norm } from './utils';

// Talks to Firebase Authentication and Firestore through their REST APIs, so no native or Metro setup is needed.
const KEY = firebaseConfig.apiKey;
const ACCOUNTS = 'https://identitytoolkit.googleapis.com/v1/accounts';
const TOKEN_URL = `https://securetoken.googleapis.com/v1/token?key=${KEY}`;
const DOCS = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

type Session = { idToken: string; refreshToken: string; uid: string; email: string; displayName: string };
let session: Session | null = null;

const fail = (code: string): never => {
  throw { code };
};

export const friendlyAuthError = (e: any): string => {
  switch (e?.code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists. Log in instead.';
    case 'auth/invalid-email': return 'That email address is not valid.';
    case 'auth/weak-password': return 'Password is too weak. Use at least 8 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Incorrect email or password. Please try again.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/expired-action-code': return 'This reset link has expired. Request a new one.';
    case 'auth/invalid-action-code': return 'This reset link was already used or is not valid. Request a new one.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed': return 'No internet connection. Check your network and try again.';
    case 'auth/operation-not-allowed': return 'This sign-in method is not enabled in the Firebase console (Authentication → Sign-in method). For password reset, turn on Email/Password with "Email link"; for Google, turn on Google.';
    case 'auth/email-not-allowed': return 'Use your school email (name@tip.edu.ph) or a Gmail address (name@gmail.com).';
    case 'auth/invalid-idp-response': return 'Google sign-in was rejected. Check the Web client ID in src/googleConfig.ts.';
    case 'auth/google-not-configured': return 'Google sign-in is not set up yet. Paste your Web client ID into src/googleConfig.ts.';
    case 'auth/google-failed': return 'Google sign-in did not finish. Please try again.';
    case 'firestore/not-persisted': return 'Your changes could not be confirmed on the server. Please try again.';
    case 'auth/no-session':
    case 'auth/session-expired': return 'Your session has expired. Log out and log in again to save changes.';
    case 'auth/no-account': return 'No Vicinia account exists for that email. Sign up instead.';
    case 'auth/invalid-api-key': return 'The Firebase API key in src/firebase.ts is missing or wrong.';
    case 'auth/configuration-not-found': return 'Firebase Authentication is not set up. Click "Get started" under Authentication in the console.';
    case 'permission-denied': return 'Firestore blocked saving your profile. Publish the rules from firestore.rules.';
    case 'not-found':
    case 'failed-precondition': return 'Create the Firestore database in the Firebase console first.';
    case 'unavailable': return 'Could not reach Firebase. Check your internet connection.';
    default: return `Something went wrong${e?.code ? ` (${e.code})` : ''}. Please try again.`;
  }
};

const AUTH_CODES: Record<string, string> = {
  EMAIL_EXISTS: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  WEAK_PASSWORD: 'auth/weak-password',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'auth/too-many-requests',
  EMAIL_NOT_FOUND: 'auth/user-not-found',
  INVALID_PASSWORD: 'auth/wrong-password',
  INVALID_LOGIN_CREDENTIALS: 'auth/invalid-credential',
  USER_DISABLED: 'auth/user-disabled',
  EXPIRED_OOB_CODE: 'auth/expired-action-code',
  INVALID_OOB_CODE: 'auth/invalid-action-code',
  CONFIGURATION_NOT_FOUND: 'auth/configuration-not-found',
  INVALID_IDP_RESPONSE: 'auth/invalid-idp-response',
};

async function send(url: string, init: RequestInit): Promise<any> {
  let res!: Response;
  try {
    res = await fetch(url, init);
  } catch {
    return fail('auth/network-request-failed');
  }
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw json;
  return json;
}

async function authPost(path: string, body: object): Promise<any> {
  try {
    return await send(`${ACCOUNTS}:${path}?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    if (e?.code) throw e; // already one of ours (e.g. network error)
    const msg = String(e?.error?.message ?? '');
    if (/API key/i.test(msg)) return fail('auth/invalid-api-key');
    return fail(AUTH_CODES[msg.split(/[ :]/)[0]] ?? `auth/${msg || 'unknown'}`);
  }
}

// `mask` limits a PATCH to those fields (Firestore updateMask), so saving one thing never overwrites the rest of the profile.
async function firestore(method: 'GET' | 'PATCH' | 'DELETE', uid: string, token: string, body?: object, mask?: string[]): Promise<any> {
  const qs = mask?.length ? `?${mask.map((m) => `updateMask.fieldPaths=${encodeURIComponent(m)}`).join('&')}` : '';
  try {
    return await send(`${DOCS}/users/${uid}${qs}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e: any) {
    if (e?.code) throw e;
    const status = String(e?.error?.status ?? '');
    return fail(
      status === 'PERMISSION_DENIED' ? 'permission-denied'
      : status === 'UNAUTHENTICATED' ? 'auth/session-expired'
      : status === 'NOT_FOUND' ? 'not-found'
      : status === 'UNAVAILABLE' ? 'unavailable'
      : `firestore/${status || 'unknown'}`
    );
  }
}

// ID tokens last one hour, so get a fresh one before each signed-in call.
async function freshSession(): Promise<Session> {
  if (!session) return fail('auth/user-not-found');
  const s = session;
  try {
    const r = await send(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refreshToken)}`,
    });
    session = { ...s, idToken: r.id_token, refreshToken: r.refresh_token ?? s.refreshToken };
  } catch (e: any) {
    if (e?.code) throw e;
    return fail('auth/invalid-credential');
  }
  return session as Session;
}

const text = (v: string) => ({ stringValue: v });
const field = (doc: any, k: string): string | undefined => doc?.fields?.[k]?.stringValue;

// Builds the app's User object from the Firestore profile (the password is never kept on the device).
async function toAppUser(s: Session): Promise<User> {
  let doc: any = null;
  try {
    doc = await firestore('GET', s.uid, s.idToken);
  } catch {
    // Fall back to the values stored on the auth account.
  }
  return {
    name: field(doc, 'name') ?? s.displayName,
    email: field(doc, 'email') ?? s.email,
    password: '',
    university: field(doc, 'university') ?? '',
    program: field(doc, 'program') ?? '',
    year: field(doc, 'year') ?? '',
    // A photo the person chose in Edit Profile (kept on the account as a small data link).
    avatarUri: field(doc, 'avatar') || undefined,
  };
}

async function deleteAccountQuietly() {
  const s = session;
  session = null;
  if (!s) return;
  try { await firestore('DELETE', s.uid, s.idToken); } catch { /* ignore */ }
  try { await authPost('delete', { idToken: s.idToken }); } catch { /* ignore */ }
}

// 1) Creates the account, 2) saves the profile in Firestore `users/{uid}`, 3) emails the verification link.
export async function signUpAndSendVerification(p: { name: string; email: string; password: string; university: string; program: string; year: string }) {
  const email = norm(p.email);
  const r = await authPost('signUp', { email, password: p.password, returnSecureToken: true });
  session = { idToken: r.idToken, refreshToken: r.refreshToken, uid: r.localId, email, displayName: p.name };
  try {
    await authPost('update', { idToken: session.idToken, displayName: p.name, returnSecureToken: false });
    await firestore('PATCH', session.uid, session.idToken, {
      fields: {
        name: text(p.name),
        email: text(email),
        university: text(p.university),
        program: text(p.program),
        year: text(p.year),
        createdAt: { timestampValue: new Date().toISOString() },
      },
    });
    await authPost('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: session.idToken });
  } catch (e) {
    // Roll back so a failed step doesn't leave a half-made account that blocks retrying.
    await deleteAccountQuietly();
    throw e;
  }
}

export async function resendVerification() {
  const s = await freshSession();
  await authPost('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: s.idToken });
}

const isVerified = async (idToken: string): Promise<boolean> => {
  const r = await authPost('lookup', { idToken });
  return !!r?.users?.[0]?.emailVerified;
};

// Re-reads the account from Firebase; returns the app user once the link has been opened, otherwise null.
export async function checkVerified(): Promise<User | null> {
  const s = await freshSession();
  return (await isVerified(s.idToken)) ? toAppUser(s) : null;
}

// Wrong email typed? Remove the unverified account so the address can be used again.
export async function discardUnverifiedAccount() {
  try { await freshSession(); } catch { /* use the old token */ }
  await deleteAccountQuietly();
}

export type LoginResult = { status: 'ok'; user: User } | { status: 'unverified' };
export async function logIn(email: string, password: string): Promise<LoginResult> {
  const e = norm(email);
  const r = await authPost('signInWithPassword', { email: e, password, returnSecureToken: true });
  session = { idToken: r.idToken, refreshToken: r.refreshToken, uid: r.localId, email: e, displayName: r.displayName ?? '' };
  if (!(await isVerified(session.idToken))) return { status: 'unverified' }; // stays signed in so "resend" works
  return { status: 'ok', user: await toAppUser(session) };
}

export const logOut = async () => { session = null; };

// Forgot-password flow (the email has no reset form in it):
// 1) the email carries a Firebase link that only proves the person owns the mailbox,
// 2) the link opens RESET_RETURN_PAGE (hosted in this Firebase project), which reopens the app at vicinia://reset-password,
// 3) the app finishes the link's sign-in and lets the user type the new password on its own screen.
const RESET_RETURN_PAGE = 'https://viciniaapp-35edd.web.app/reset';

// Emails the confirmation link. Firebase sends it whether or not the address has an account, so nothing is revealed.
export async function sendPasswordReset(email: string) {
  const e = norm(email);
  await authPost('sendOobCode', {
    requestType: 'EMAIL_SIGNIN',
    email: e,
    continueUrl: `${RESET_RETURN_PAGE}?email=${encodeURIComponent(e)}`,
    canHandleCodeInApp: true,
  });
}

let resetIdToken = '';

// Called when the app is opened from the emailed link: uses up the code and unlocks the password change.
export async function beginPasswordReset(oobCode: string, email: string): Promise<string> {
  resetIdToken = '';
  const r = await authPost('signInWithEmailLink', { email: norm(email), oobCode });
  if (r?.isNewUser) {
    // This address has no Vicinia account: the link just created an empty one, so remove it again.
    try { await authPost('delete', { idToken: r.idToken }); } catch { /* ignore */ }
    return fail('auth/no-account');
  }
  resetIdToken = r.idToken;
  return String(r?.email ?? norm(email));
}

export async function finishPasswordReset(newPassword: string) {
  if (!resetIdToken) return fail('auth/invalid-action-code');
  await authPost('update', { idToken: resetIdToken, password: newPassword, returnSecureToken: false });
  resetIdToken = '';
}

// Google sign-in: the Google SDK (see googleAuth.ts) hands over an ID token and Firebase swaps it for a Vicinia session.
// The first time an address is used this creates the account and its Firestore profile; later it just logs in.
export async function signInWithGoogleToken(googleIdToken: string, sdkPhoto?: string): Promise<User> {
  const r = await authPost('signInWithIdp', {
    postBody: `id_token=${encodeURIComponent(googleIdToken)}&providerId=google.com`,
    requestUri: 'http://localhost',
    returnIdpCredential: true,
    returnSecureToken: true,
  });
  const email = norm(String(r?.email ?? ''));
  if (!isAllowedEmail(email)) {
    // Same rule as sign-up: school email or Gmail. Remove an account this attempt just created.
    if (r?.isNewUser) { try { await authPost('delete', { idToken: r.idToken }); } catch { /* ignore */ } }
    return fail('auth/email-not-allowed');
  }
  const name = String(r?.displayName ?? r?.fullName ?? '') || email.split('@')[0];
  session = { idToken: r.idToken, refreshToken: r.refreshToken, uid: r.localId, email, displayName: name };
  if (r?.isNewUser) {
    try {
      await firestore('PATCH', session.uid, session.idToken, {
        fields: {
          name: text(name),
          email: text(email),
          university: text('Technological Institute of the Philippines Q.C.'),
          program: text(''),
          year: text(''),
          createdAt: { timestampValue: new Date().toISOString() },
        },
      });
    } catch (e) {
      await deleteAccountQuietly(); // don't leave an account without a profile
      throw e;
    }
  }
  // Use the Google profile picture as the app avatar (bigger size than Google's default thumbnail).
  const user = await toAppUser(session);
  // Firebase's photoUrl first, then the picture inside rawUserInfo, then the one the Google SDK gave us.
  let raw: any = null;
  try { raw = typeof r?.rawUserInfo === 'string' ? JSON.parse(r.rawUserInfo) : r?.rawUserInfo; } catch { /* ignore */ }
  const found = [r?.photoUrl, raw?.picture, sdkPhoto].find((u) => typeof u === 'string' && u.startsWith('http')) as string | undefined;
  const photo = found ? found.replace(/=s\d+-c$/, '=s256-c') : '';
  // A photo chosen in Edit Profile wins over the Google one.
  return photo && !user.avatarUri ? { ...user, avatarUri: photo } : user;
}

/* ---------- Signed-in account data: profile and settings (Firestore users/{uid}, same document as sign-up) ---------- */

// Every call below uses a fresh ID token as the Bearer header, exactly like the rest of this file.
async function accountSession(): Promise<Session> {
  if (!session) return fail('auth/no-session');
  try {
    return await freshSession();
  } catch (e: any) {
    if (e?.code === 'auth/invalid-credential') return fail('auth/session-expired'); // the refresh token was rejected
    throw e;
  }
}

// Key order doesn't matter when comparing what we sent with what the server says it stored.
const canon = (v: any): string =>
  v && typeof v === 'object' ? (Array.isArray(v) ? `[${v.map(canon).join(',')}]` : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`) : JSON.stringify(v);

// Writes only the masked fields, then checks the document the server sends back. A non-2xx reply already throws (see send());
// this also catches a 2xx reply whose stored document does not contain what was sent, so "saved" is never reported for a write that didn't persist.
async function writeFields(s: Session, fields: Record<string, any>, mask: string[]): Promise<void> {
  const stored = (await firestore('PATCH', s.uid, s.idToken, { fields }, mask))?.fields ?? {};
  if (mask.some((k) => canon(stored[k]) !== canon(fields[k]))) fail('firestore/not-persisted');
}

export type AccountProfile = Pick<User, 'name' | 'university' | 'program' | 'year' | 'avatarUri'>;

// Reads the saved profile from the account. Throws if it can't be read (so the screen can say so instead of showing stale data as fresh).
export async function fetchAccountProfile(): Promise<AccountProfile> {
  const s = await accountSession();
  const doc = await firestore('GET', s.uid, s.idToken);
  return {
    name: field(doc, 'name') ?? s.displayName,
    university: field(doc, 'university') ?? '',
    program: field(doc, 'program') ?? '',
    year: field(doc, 'year') ?? '',
    avatarUri: field(doc, 'avatar') || undefined,
  };
}

// `avatar`: undefined = leave the saved photo alone, '' = remove it, or a data: link = new photo.
// Only these fields are written (updateMask); email and createdAt are never touched. The email is the login, so it is not changed here.
export type ProfileUpdate = { name: string; university: string; program: string; year: string; avatar?: string };
export async function updateProfile(p: ProfileUpdate): Promise<void> {
  const s = await accountSession();
  const fields: Record<string, any> = { name: text(p.name), university: text(p.university), program: text(p.program), year: text(p.year) };
  const mask = ['name', 'university', 'program', 'year'];
  if (p.avatar !== undefined) { fields.avatar = text(p.avatar); mask.push('avatar'); }
  await writeFields(s, fields, mask);
  if (p.name !== s.displayName) {
    // Keep the auth account's display name in step. The Firestore profile is what the app reads, so a failure here is not fatal.
    try {
      await authPost('update', { idToken: s.idToken, displayName: p.name, returnSecureToken: false });
      if (session) session = { ...session, displayName: p.name };
    } catch { /* ignore */ }
  }
}

// Account-level settings (cross-device): stored as users/{uid}.settings = { notif: {...}, privacy: {...} } with boolean values.
export type RemoteSettings = { notif: Record<string, boolean>; privacy: Record<string, boolean> };

const boolMap = (o: Record<string, boolean>) => ({
  mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { booleanValue: v }])) },
});
const readBools = (m: any): Record<string, boolean> | undefined => {
  const f = m?.mapValue?.fields;
  if (!f) return undefined;
  const out: Record<string, boolean> = {};
  Object.keys(f).forEach((k) => { if (typeof f[k]?.booleanValue === 'boolean') out[k] = f[k].booleanValue; });
  return out;
};

// null = nothing saved on this account yet.
export async function loadRemoteSettings(): Promise<Partial<RemoteSettings> | null> {
  const s = await accountSession();
  const doc = await firestore('GET', s.uid, s.idToken);
  const m = doc?.fields?.settings?.mapValue?.fields;
  if (!m) return null;
  return { notif: readBools(m.notif), privacy: readBools(m.privacy) };
}

export async function saveRemoteSettings(v: RemoteSettings): Promise<void> {
  const s = await accountSession();
  await writeFields(s, { settings: { mapValue: { fields: { notif: boolMap(v.notif), privacy: boolMap(v.privacy) } } } }, ['settings']);
}

// For the events feed: the Bearer token when someone is signed in (reads also work without one if the rules allow it).
export async function eventsAuth(): Promise<{ token?: string; uid?: string; email?: string }> {
  if (!session) return {};
  try {
    const s = await freshSession();
    return { token: s.idToken, uid: s.uid, email: s.email };
  } catch {
    return {}; // an expired session must not block reading public events; posting then reports "log in again"
  }
}
