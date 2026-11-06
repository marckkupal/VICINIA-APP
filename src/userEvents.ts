import { useMemo } from 'react';
import type { CampusEvent } from './data';
import { eventDate, startMs } from './eventModel';
import { useEventFeed } from './eventsStore';
import { createPersistedList } from './persist';

// Events now live on the server (Firestore `events`, see eventsApi.ts / eventsStore.ts).
// `legacy` only reads what people posted on this device before that change, so it does not disappear. Nothing new is written to it.
const legacy = createPersistedList<CampusEvent>('vicinia_user_events');
const KEY = 'all';

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const EVENT_CATEGORIES: { label: string; icon: string; bg: string }[] = [
  { label: 'Workshop', icon: '🛠️', bg: '#FDF1C4' },
  { label: 'Technology', icon: '💻', bg: '#E6EDFB' },
  { label: 'Academic', icon: '📚', bg: '#E3F0E4' },
  { label: 'Wellness', icon: '🌿', bg: '#E3F0E4' },
  { label: 'Social', icon: '🎉', bg: '#F8E9E5' },
  { label: 'Sports', icon: '🏀', bg: '#E6EDFB' },
  { label: 'Arts & culture', icon: '🎨', bg: '#EDE6F7' },
];

export { eventDate };

// Server events plus this device's older local ones, in date order. Use this wherever events are listed or opened.
export function useAllEvents(): CampusEvent[] { return useEventList().events; }

// Same, with the loading / error state of the feed.
export function useEventList() {
  const feed = useEventFeed();
  const mine = legacy.useItems(KEY);
  const events = useMemo(() => {
    const ids = new Set(feed.events.map((e) => e.id));
    const local = mine.filter((e) => !ids.has(e.id)).map((e) => ({ ...e, local: true as const, fee: e.fee ?? null }));
    return [...local, ...feed.events].sort((a, b) => startMs(a) - startMs(b));
  }, [mine, feed.events]);
  return { ...feed, events };
}
