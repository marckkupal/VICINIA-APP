import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from './persist';

// Remembers that the intro slides were finished or skipped, so they are not shown again after the app is closed.
// Device-wide (the intro shows before anyone logs in). Damaged or missing saved data counts as "not seen".

export const ONBOARDING_KEY = 'vicinia_onboarding_seen';

let seen = false;
let ready: Promise<boolean> | null = null;

export const hasSeenOnboarding = (): Promise<boolean> =>
  (ready ??= loadJSON<unknown>(ONBOARDING_KEY, false).then((v) => { if (v === true) seen = true; return seen; }));

export async function markOnboardingSeen() {
  seen = true;
  await saveJSON(ONBOARDING_KEY, true);
}

// For tests / "reset app" tooling.
export async function resetOnboarding() {
  seen = false;
  ready = null;
  await saveJSON(ONBOARDING_KEY, false);
}

// null while loading, then true/false. App.tsx can use it to skip <Onboarding /> on later launches.
export function useOnboardingSeen(): boolean | null {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    hasSeenOnboarding().then((x) => { if (live) setV(x); });
    return () => { live = false; };
  }, []);
  return v;
}
