import { useEffect, useState } from 'react';

// Where a notification takes the person when tapped.
export type NotifTarget =
  | { kind: 'profile'; personId: string }
  | { kind: 'message'; personId: string }
  | { kind: 'board'; boardId: string }
  | { kind: 'event'; eventId: string }
  | { kind: 'place'; placeId: string }
  | { kind: 'library' }
  | { kind: 'myProfile' };

export type NotifType = 'follow' | 'message' | 'board' | 'event' | 'place' | 'library' | 'welcome';

export interface AppNotification {
  id: string; type: NotifType; title: string; body: string;
  createdAt: number; read: boolean; target: NotifTarget;
  personId?: string; // shows that person's initials as the leading avatar
}

const MIN = 60000;
const ago = (mins: number) => Date.now() - mins * MIN;

// Sample activity for the demo. Not live data.
const seed = (): AppNotification[] => [
  { id: 'n1', type: 'follow', personId: 'mika', title: 'Mika Reyes started following you', body: 'Photography Club admin · TIP Quezon City', createdAt: ago(8), read: false, target: { kind: 'profile', personId: 'mika' } },
  { id: 'n2', type: 'message', personId: 'angela', title: 'Angela Cruz sent you a message', body: '“Hi Juan! Do you still have the Calculus 2 review sheets?”', createdAt: ago(25), read: false, target: { kind: 'message', personId: 'angela' } },
  { id: 'n3', type: 'board', personId: 'ian', title: 'Ian Soriano replied in Tech Club', body: '“Resume review is open to 3rd-year students. Drop your questions.”', createdAt: ago(70), read: false, target: { kind: 'board', boardId: '3' } },
  { id: 'n4', type: 'event', title: 'Reminder: Semicon Hackathon', body: 'Oct 28 · 1:00 PM · Seminar Hall Bldg', createdAt: ago(180), read: false, target: { kind: 'event', eventId: 'semicon' } },
  { id: 'n5', type: 'place', title: 'Brew & Books Cafe is open now', body: 'A popular study stop, 0.3 km from campus', createdAt: ago(60 * 6), read: true, target: { kind: 'place', placeId: '1' } },
  { id: 'n6', type: 'library', title: 'Library study room reminder', body: 'Your group room request is for tomorrow, 4:00 PM', createdAt: ago(60 * 27), read: true, target: { kind: 'library' } },
  { id: 'n7', type: 'board', personId: 'mika', title: 'Mika Reyes replied in Photography Club', body: '“Beginners are welcome! Bring any camera you have.”', createdAt: ago(60 * 30), read: true, target: { kind: 'board', boardId: '6' } },
  { id: 'n8', type: 'event', title: 'Wellness Day is coming up', body: 'Nov 12 · 9:00 AM · Clinic & Guidance Office', createdAt: ago(60 * 24 * 2 + 40), read: true, target: { kind: 'event', eventId: 'wellness' } },
  { id: 'n9', type: 'board', personId: 'angelica', title: 'Angelica Torres upvoted your post', body: 'Academics Hub · “Notes for Data Structures midterms”', createdAt: ago(60 * 24 * 3), read: true, target: { kind: 'board', boardId: '7' } },
  { id: 'n10', type: 'message', personId: 'carlo', title: 'Carlo Dizon sent you a message', body: '“Valorant scrims moved to 5 PM this Wednesday.”', createdAt: ago(60 * 24 * 4 + 12), read: true, target: { kind: 'message', personId: 'carlo' } },
  { id: 'n11', type: 'welcome', title: 'Welcome to Vicinia', body: 'Add your interests to find people and places on campus', createdAt: ago(60 * 24 * 6), read: true, target: { kind: 'myProfile' } },
];

/* ---------- Tiny shared store so read state survives tab switches ---------- */
// Notifications are kept per account, so a brand-new account always starts with an empty list.
const lists: Record<string, AppNotification[]> = {};
let activeKey = 'guest';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const getItems = () => (lists[activeKey] ??= []);
const set = (next: AppNotification[]) => { lists[activeKey] = next; emit(); };

export const setNotifUser = (email?: string | null) => { activeKey = (email ?? '').trim().toLowerCase() || 'guest'; };

export const notifActions = {
  markRead: (id: string) => set(getItems().map((n) => (n.id === id && !n.read ? { ...n, read: true } : n))),
  markAllRead: () => set(getItems().map((n) => (n.read ? n : { ...n, read: true }))),
  clearAll: () => set([]),
  restore: () => set(seed()),
};

export function useNotifications() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const items = getItems();
  return { items, unread: items.filter((n) => !n.read).length };
}

/* ---------- Formatting ---------- */
export const agoLabel = (ts: number) => {
  const m = Math.max(0, Math.floor((Date.now() - ts) / MIN));
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h ago`;
  if (m < 60 * 48) return 'Yesterday';
  return `${Math.floor(m / (60 * 24))}d ago`;
};
export const sectionOf = (ts: number): 'Today' | 'Yesterday' | 'Earlier' => {
  const m = (Date.now() - ts) / MIN;
  return m < 60 * 24 ? 'Today' : m < 60 * 48 ? 'Yesterday' : 'Earlier';
};

export const TYPE_ICON: Record<NotifType, { icon: string; bg: string }> = {
  follow: { icon: '👋', bg: '#E3F0E4' },
  message: { icon: '💬', bg: '#E6EDFB' },
  board: { icon: '💬', bg: '#FDF1C4' },
  event: { icon: '🗓️', bg: '#DCEADB' },
  place: { icon: '📍', bg: '#FADFD6' },
  library: { icon: '📖', bg: '#FDF1C4' },
  welcome: { icon: '🔔', bg: '#F3D9D6' },
};
