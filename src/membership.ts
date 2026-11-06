import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from './persist';

// What each account has joined / registered for / saved. Keyed by email so a brand-new account always starts empty.
// Saved on this device after every change, so it is still there after the app is closed.
type Data = { boards: string[]; events: string[]; places: string[] };
const db: Record<string, Data> = {};
const listeners = new Set<() => void>();
let active = 'guest';

const keyOf = (email?: string | null) => (email ?? active).trim().toLowerCase() || 'guest';
const dataOf = (email?: string | null): Data => (db[keyOf(email)] ??= { boards: [], events: [], places: [] });
const emit = () => listeners.forEach((l) => l());

const KEY = 'vicinia_membership';
const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];
let ready: Promise<void> | null = null;
// Loads once at startup. Anything changed before the load finishes is kept.
const start = () => (ready ??= loadJSON<Record<string, Partial<Data>>>(KEY, {}).then((saved) => {
  Object.keys(saved ?? {}).forEach((k) => {
    const s = saved[k] ?? {};
    const cur = db[k] ?? { boards: [], events: [], places: [] };
    db[k] = { boards: union(list(s.boards), cur.boards), events: union(list(s.events), cur.events), places: union(list(s.places), cur.places) };
  });
  emit();
}));
const save = () => { start().then(() => saveJSON(KEY, db)); };
const flip = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

// Home and Profile call this so screens without a user prop still use the signed-in account.
export const setActiveUser = (email?: string | null) => { active = keyOf(email); };

export function useMembership(email?: string | null): Data {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    start();
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return dataOf(email);
}

export const toggleBoard = (email: string | null | undefined, id: string) => { const d = dataOf(email); d.boards = flip(d.boards, id); emit(); save(); };
// Joins only; does nothing if the account is already a member (unlike toggleBoard, which also leaves).
export const joinBoard = (email: string | null | undefined, id: string) => { const d = dataOf(email); if (!d.boards.includes(id)) { d.boards = [...d.boards, id]; emit(); save(); } };
export const toggleSavedPlace = (email: string | null | undefined, id: string) => { const d = dataOf(email); d.places = flip(d.places, id); emit(); save(); };
export const unregisterEvent = (email: string | null | undefined, id: string) => { const d = dataOf(email); d.events = d.events.filter((x) => x !== id); emit(); save(); };
export const registerEvent = (email: string | null | undefined, id: string) => { const d = dataOf(email); if (!d.events.includes(id)) d.events = [...d.events, id]; emit(); save(); };

start();
