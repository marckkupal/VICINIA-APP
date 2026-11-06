import { useEffect, useState } from 'react';
import { friendlyAuthError, loadRemoteSettings, saveRemoteSettings } from './auth';
import type { RemoteSettings } from './auth';
import { loadJSON, saveJSON } from './persist';

// Notification and privacy toggles. Where each one lives:
//
//  ACCOUNT-LEVEL (Firestore users/{uid}.settings, so it follows the person to other devices):
//    notif.replies, notif.events, notif.recs, privacy.campus, privacy.suggest
//    A toggle is saved to the account first; the screen shows the new value right away and puts the old one back if saving fails.
//    This device also keeps a copy so the screen has something to show instantly and offline; the account is the source of truth.
//
//  DEVICE-LEVEL (AsyncStorage only, never sent anywhere):
//    privacy.location. It describes this phone's location permission, so it is not shared across devices.
export type NotifPrefs = { replies: boolean; events: boolean; recs: boolean };
export type PrivacyPrefs = { campus: boolean; suggest: boolean; location: boolean };
export type Settings = { notif: NotifPrefs; privacy: PrivacyPrefs };

const DEFAULTS: Settings = {
  notif: { replies: true, events: true, recs: false },
  privacy: { campus: true, suggest: true, location: false },
};

const KEY = 'vicinia_settings';
// Only accounts that changed something (or were loaded) have an entry; everyone else reads DEFAULTS.
const db: Record<string, Settings> = {};
const saving = new Set<string>(); // accounts with a save in flight
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const keyOf = (email?: string | null) => (email ?? 'guest').trim().toLowerCase() || 'guest';

// Keep only known keys with real booleans, so old or damaged saved data can't break the screen.
function clean<T extends Record<string, boolean>>(defaults: T, saved: unknown): T {
  const out = { ...defaults };
  if (saved && typeof saved === 'object') {
    (Object.keys(defaults) as (keyof T)[]).forEach((k) => {
      const v = (saved as Record<string, unknown>)[k as string];
      if (typeof v === 'boolean') out[k] = v as T[keyof T];
    });
  }
  return out;
}

let ready: Promise<void> | null = null;
// Loads this device's copy once at startup. A toggle changed before the load finishes wins over the saved value.
const start = () => (ready ??= loadJSON<Record<string, Partial<Settings>>>(KEY, {}).then((saved) => {
  Object.keys(saved ?? {}).forEach((k) => {
    if (db[k]) return;
    const s = saved[k] ?? {};
    db[k] = { notif: clean(DEFAULTS.notif, s.notif), privacy: clean(DEFAULTS.privacy, s.privacy) };
  });
  emit();
}));
const saveLocal = () => { start().then(() => saveJSON(KEY, db)); };

const mine = (email?: string | null): Settings => (db[keyOf(email)] ??= { notif: { ...DEFAULTS.notif }, privacy: { ...DEFAULTS.privacy } });

// Only the account-level values go to the backend (location stays on the device).
const toRemote = (s: Settings): RemoteSettings => ({
  notif: { ...s.notif },
  privacy: { campus: s.privacy.campus, suggest: s.privacy.suggest },
});

function useTick() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
}

// Reads the current values without React (used by tests and non-UI code).
export const peekSettings = (email?: string | null): Settings => db[keyOf(email)] ?? DEFAULTS;

export function useSettings(email?: string | null): Settings {
  useTick();
  useEffect(() => { start(); }, []);
  return db[keyOf(email)] ?? DEFAULTS;
}

// Reads the saved account settings and applies them. Throws if they can't be read.
// A value whose save is still in flight keeps the value the person just chose.
export async function hydrateSettings(email?: string | null): Promise<void> {
  await start();
  const remote = await loadRemoteSettings();
  if (!remote) return; // nothing saved on the account yet: keep what is here
  const d = mine(email);
  if (!saving.has(keyOf(email))) {
    d.notif = clean(d.notif, remote.notif);
    d.privacy = clean(d.privacy, { campus: remote.privacy?.campus, suggest: remote.privacy?.suggest });
  }
  emit();
  saveLocal();
}

// Loads the account settings when a settings screen opens and tells it whether it is loading, failed, or saving.
// While loading (or after a failed load) the account-level toggles should be disabled: saving from an unconfirmed copy could overwrite newer values.
export function useSettingsSync(email?: string | null) {
  useTick();
  const [state, setState] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ loading: true, error: null });
    hydrateSettings(email)
      .then(() => { if (live) setState({ loading: false, error: null }); })
      .catch((e) => { if (live) setState({ loading: false, error: `Couldn’t load your saved settings. ${friendlyAuthError(e)}` }); });
    return () => { live = false; };
  }, [email, attempt]);
  return {
    loading: state.loading,
    error: state.error,
    saving: saving.has(keyOf(email)),
    // true when account-level toggles must not be used
    locked: state.loading || !!state.error || saving.has(keyOf(email)),
    retry: () => setAttempt((n) => n + 1),
  };
}

// Saves a change to the account FIRST. The value the screen shows only changes after the server confirmed it, so a failed save never looks like a success.
// Resolves true when it was saved, false when ignored because another save is running; rejects (nothing changed) when saving failed.
// One save at a time per account.
async function saveAccountChange(email: string | null | undefined, apply: (d: Settings) => void): Promise<boolean> {
  const key = keyOf(email);
  if (saving.has(key)) return false;
  saving.add(key); // claimed before any await, so two quick taps can never both get through
  emit();
  try {
    await start();
    const d = mine(email);
    const next: Settings = { notif: { ...d.notif }, privacy: { ...d.privacy } };
    apply(next);
    await saveRemoteSettings(toRemote(next)); // throws on network failure, non-2xx, or a write that did not persist
    d.notif = next.notif;
    d.privacy = { ...d.privacy, campus: next.privacy.campus, suggest: next.privacy.suggest };
    saveLocal();
    return true;
  } finally {
    saving.delete(key);
    emit();
  }
}

export const toggleNotifPref = (email: string | null | undefined, k: keyof NotifPrefs): Promise<boolean> =>
  saveAccountChange(email, (d) => { d.notif = { ...d.notif, [k]: !d.notif[k] }; });

// Resolves 'account' (saved to the account), 'device' (location, saved on this device only) or null (ignored: a save was already running).
export async function togglePrivacyPref(email: string | null | undefined, k: keyof PrivacyPrefs): Promise<'account' | 'device' | null> {
  if (k === 'location') {
    // Device-level: no backend call.
    await start();
    const d = mine(email);
    d.privacy = { ...d.privacy, location: !d.privacy.location };
    emit();
    saveLocal();
    return 'device';
  }
  return (await saveAccountChange(email, (d) => { d.privacy = { ...d.privacy, [k]: !d.privacy[k] }; })) ? 'account' : null;
}

start();
