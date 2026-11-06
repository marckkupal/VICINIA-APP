import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from './persist';

// Reports people send about a place in Explore or a post on Home. Kept on this device so the same account can't report the same item twice.
// (Prototype storage: nothing is sent anywhere yet. For real moderation, write these to Firestore and let staff review them.)
export type Report = { itemId: string; reason: string; by: string; at: number };

// Reasons for a post (Home feed).
export const POST_REPORT_REASONS = [
  'Spam or advertising',
  'Harassment or bullying',
  'Hate or inappropriate content',
  'False or misleading information',
  'Something else',
] as const;

// Reasons for a place in Explore.
export const REPORT_REASONS = [
  'Wrong or misleading information',
  'Spam or advertising',
  'Scam or unsafe',
  'Closed or doesn’t exist',
  'Something else',
] as const;

const KEY = 'vicinia_place_reports';
let list: Report[] = [];
let ready: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const start = () => (ready ??= loadJSON<Report[]>(KEY, []).then((saved) => {
  const have = new Set(list.map((r) => `${r.by}|${r.itemId}`));
  const old = (Array.isArray(saved) ? saved : []).filter((r) => r && typeof r.itemId === 'string' && !have.has(`${r.by}|${r.itemId}`));
  list = [...list, ...old];
  emit();
}));

const who = (email?: string | null) => (email ?? 'guest').trim().toLowerCase() || 'guest';

// itemId: a place id, or `post:<id>` for a Home post.
export const reportItem = (itemId: string, reason: string, email?: string | null) => {
  list = [...list, { itemId, reason, by: who(email), at: Date.now() }];
  emit();
  start().then(() => saveJSON(KEY, list));
};

// true once this account has reported this listing
export function useHasReported(itemId: string, email?: string | null): boolean {
  const [, force] = useState(0);
  useEffect(() => {
    start();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const me = who(email);
  return list.some((r) => r.itemId === itemId && r.by === me);
}
