import type { CampusEvent } from './data';
import { eventDate } from './eventModel';
import type { FeedStatus } from './eventsStore';

// Pure view logic for the Events page: which events show for a day / filter / category, and which state the page is in.
export type Filter = 'For you' | 'Today' | 'This week' | 'Free';
export const FILTERS: Filter[] = ['For you', 'Today', 'This week', 'Free'];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

// Categories that actually occur in the loaded events (never a fixed list), so there are no empty chips.
export const categoriesOf = (events: CampusEvent[]): string[] => [...new Set(events.map((e) => e.kind))].sort();

export interface Selection { filter: Filter; category: string | null; sel: Date; today: Date }

export function selectEvents(events: CampusEvent[], { filter, category, sel, today }: Selection) {
  const weekEnd = addDays(mondayOf(today), 6);
  const pool = category ? events.filter((e) => e.kind === category) : events;
  const upcoming = pool.filter((e) => {
    const d = eventDate(e);
    if (filter === 'Today') return sameDay(d, today);
    if (filter === 'This week') return d >= mondayOf(today) && d <= weekEnd;
    if (filter === 'Free') return e.fee === 0 && d >= sel; // an unlisted fee is not "free"
    return d >= sel;
  });
  const onSelDay = upcoming.filter((e) => sameDay(eventDate(e), sel));
  const featured = onSelDay.find((e) => e.featured) ?? onSelDay[0] ?? upcoming.find((e) => e.featured) ?? upcoming[0];
  const rest = upcoming.filter((e) => e.id !== featured?.id); // the featured event is not repeated below it
  return { upcoming, featured, rest, onSelDay };
}

export type PageMode = 'loading' | 'error' | 'empty' | 'noMatch' | 'list';

// loading: nothing to show yet; error: failed with nothing to show; empty: the server has no upcoming events;
// noMatch: events exist but not for this day / filter / category; list: show them.
export function pageMode(a: { status: FeedStatus; scope: CampusEvent[]; today: Date; upcomingCount: number; plain: boolean }): PageMode {
  if (a.scope.length === 0) {
    if (a.status === 'idle' || a.status === 'loading') return 'loading';
    if (a.status === 'error') return 'error';
    return 'empty';
  }
  if (a.plain) return 'list';
  if (!a.scope.some((e) => eventDate(e) >= a.today)) return 'empty';
  return a.upcomingCount === 0 ? 'noMatch' : 'list';
}
