import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset } from 'react-native-image-picker';

// Small helpers that keep what people create on this device (AsyncStorage), so it is still there after the app is closed.
// Prototype storage: swap for Firebase (Firestore + Storage) so posts are shared between devices and students.

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveJSON(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('Could not save', key); // the data stays in memory for this session
  }
}

// Same as saveJSON but lets the error through, for actions that must tell the person when saving failed (e.g. creating a board).
export async function saveJSONStrict(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// A list of items grouped under a key (e.g. one account's posts, or one board's posts). Newest first, saved after every add.
export function createPersistedList<T extends { id: string }>(storageKey: string) {
  let data: Record<string, T[]> = {};
  let ready: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  // Loads once. Anything added before the load finishes is kept and saved items are merged in behind it.
  const start = () => (ready ??= loadJSON<Record<string, T[]>>(storageKey, {}).then((saved) => {
    const next = { ...data };
    Object.keys(saved ?? {}).forEach((k) => {
      const list = Array.isArray(saved[k]) ? saved[k] : [];
      const have = new Set((next[k] ?? []).map((x) => x.id));
      next[k] = [...(next[k] ?? []), ...list.filter((x) => x && typeof x.id === 'string' && !have.has(x.id))];
    });
    data = next;
    emit();
  }));

  const empty: T[] = [];
  return {
    // Reads saved items now (otherwise the first screen that shows the list does it). Safe to call more than once.
    load: () => start(),
    add(key: string, item: T) {
      data = { ...data, [key]: [item, ...(data[key] ?? [])] };
      emit();
      start().then(() => saveJSON(storageKey, data));
    },
    // Like add, but resolves only once the item is saved, and undoes the add (and rejects) if saving fails.
    // Used by the composer so the person can see "Posting…" and is told when something went wrong.
    async addAsync(key: string, item: T) {
      await start();
      data = { ...data, [key]: [item, ...(data[key] ?? [])] };
      emit();
      try {
        await saveJSONStrict(storageKey, data);
      } catch (e) {
        data = { ...data, [key]: (data[key] ?? []).filter((x) => x.id !== item.id) };
        emit();
        throw e;
      }
    },
    useItems(key: string): T[] {
      const [, force] = useState(0);
      useEffect(() => {
        start();
        const l = () => force((n) => n + 1);
        listeners.add(l);
        return () => { listeners.delete(l); };
      }, []);
      return data[key] ?? empty;
    },
  };
}

// Photos are kept inside the saved post as small data links, because the picker's own temporary file is deleted by iOS and would vanish.
export const PHOTO_OPTIONS = { quality: 0.7, maxWidth: 1080, maxHeight: 1080, includeBase64: true } as const;
export const assetUri = (a: Asset): string | undefined => (a.base64 ? `data:${a.type ?? 'image/jpeg'};base64,${a.base64}` : a.uri);

// Posts are kept per account, so one student never sees another's.
export const acct = (email?: string | null) => (email ?? 'guest').trim().toLowerCase() || 'guest';
