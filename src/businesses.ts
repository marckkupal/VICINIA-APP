import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Place, PlaceKind } from './data';

// Businesses posted by owners from Explore. Shared by everyone on this device and kept across restarts.
// (Prototype storage: swap for a real backend so posts are visible to every student.)
const KEY = 'vicinia_businesses';

export const BUSINESS_CATEGORIES: { label: string; kind: PlaceKind; emoji: string }[] = [
  { label: 'Cafe / Restaurant', kind: 'food', emoji: '🍜' },
  { label: 'Study space', kind: 'study', emoji: '📚' },
  { label: 'Shop / Store', kind: 'shops', emoji: '🛍️' },
  { label: 'Services', kind: 'shops', emoji: '🧰' },
];
export const BUSINESS_EMOJIS = ['☕', '🍜', '🍔', '🧋', '📚', '🛍️', '💈', '🖨️', '🧺', '💻', '🍰', '🏋️'];

export interface BusinessInput {
  name: string; category: string; emoji: string; address: string;
  hours?: string; contact?: string; about?: string; ownerEmail?: string;
}

let list: Place[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const persist = async () => { try { await AsyncStorage.setItem(KEY, JSON.stringify(list)); } catch { /* keep in memory */ } };
const load = async () => {
  if (loaded) return;
  loaded = true;
  try {
    const saved = await AsyncStorage.getItem(KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (Array.isArray(parsed)) { list = parsed.filter((p) => p && typeof p.id === 'string' && p.business); emit(); }
  } catch { /* start empty */ }
};

export function useBusinesses(): Place[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    load();
    return () => { listeners.delete(l); };
  }, []);
  return list;
}

export const addBusiness = (b: BusinessInput): Place => {
  const cat = BUSINESS_CATEGORIES.find((c) => c.label === b.category) ?? BUSINESS_CATEGORIES[2];
  const place: Place = {
    id: `biz_${Date.now()}`, name: b.name.trim(), kind: cat.kind, type: cat.label,
    distance: '', status: 'New listing', emoji: b.emoji || cat.emoji,
    business: true, address: b.address.trim(), hours: b.hours?.trim() || undefined,
    contact: b.contact?.trim() || undefined, about: b.about?.trim() || undefined, ownerEmail: b.ownerEmail?.trim().toLowerCase(),
  };
  list = [place, ...list];
  emit(); persist();
  return place;
};

export const removeBusiness = (id: string) => { list = list.filter((p) => p.id !== id); emit(); persist(); };
