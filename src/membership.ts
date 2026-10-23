import { useEffect, useState } from 'react';

// What each account has joined / registered for / saved. Keyed by email so a brand-new account always starts empty.
// Kept in memory for the session; swap for AsyncStorage (see storage.ts) to keep it across restarts.
type Data = { boards: string[]; events: string[]; places: string[] };
const db: Record<string, Data> = {};
const listeners = new Set<() => void>();
let active = 'guest';

const keyOf = (email?: string | null) => (email ?? active).trim().toLowerCase() || 'guest';
const dataOf = (email?: string | null): Data => (db[keyOf(email)] ??= { boards: [], events: [], places: [] });
const emit = () => listeners.forEach((l) => l());
const flip = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

// Home and Profile call this so screens without a user prop still use the signed-in account.
export const setActiveUser = (email?: string | null) => { active = keyOf(email); };

export function useMembership(email?: string | null): Data {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return dataOf(email);
}

export const toggleBoard = (email: string | null | undefined, id: string) => { const d = dataOf(email); d.boards = flip(d.boards, id); emit(); };
export const toggleSavedPlace = (email: string | null | undefined, id: string) => { const d = dataOf(email); d.places = flip(d.places, id); emit(); };
export const unregisterEvent = (email: string | null | undefined, id: string) => { const d = dataOf(email); d.events = d.events.filter((x) => x !== id); emit(); };
export const registerEvent = (email: string | null | undefined, id: string) => { const d = dataOf(email); if (!d.events.includes(id)) d.events = [...d.events, id]; emit(); };
