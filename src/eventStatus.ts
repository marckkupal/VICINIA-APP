// Past / upcoming status, worked out from the clock at render time (never stored in the JSON).
// Campus time is Philippine Standard Time (UTC+8, no daylight saving), so "the rest of the day" is the same on every phone.
// Three statuses, derived from the event's date and the clock: Past, Upcoming (not over yet, including one happening right now) and Date TBA (no usable date).
export type EventStatus = 'upcoming' | 'past' | 'tba';
export const STATUS_ORDER: EventStatus[] = ['upcoming', 'past', 'tba'];
export const STATUS_LABEL: Record<EventStatus, string> = { upcoming: 'Upcoming', past: 'Past', tba: 'Date TBA' };

const HOUR = 3600e3, DAY = 24 * HOUR, MANILA = 8 * HOUR;

// When the event starts and ends. No end time given: it ends when its day ends (Manila time).
// Legacy events with only a date (no startsAt) are treated as lasting the whole date.
export function eventWindow(e: { startsAt?: number; endsAt?: number }, legacyStart?: number): { start: number; end: number } | null {
  const start = e.startsAt ?? legacyStart;
  if (start === undefined || !Number.isFinite(start)) return null;
  const endOfDay = e.startsAt !== undefined ? Math.floor((start + MANILA) / DAY) * DAY + DAY - MANILA : start + DAY;
  const end = e.endsAt !== undefined && Number.isFinite(e.endsAt) && e.endsAt > start ? e.endsAt : endOfDay;
  return { start, end };
}

// No usable date => 'tba'. The page never guesses a date.
export function eventStatus(e: { startsAt?: number; endsAt?: number }, now: number = Date.now(), legacyStart?: number): EventStatus {
  const w = eventWindow(e, legacyStart);
  if (!w) return 'tba';
  return now < w.end ? 'upcoming' : 'past';
}

// The event an organization card spotlights: its preferred one if set and found, else the next one coming up (or happening now), else the most recent past one.
export function pickFeatured<T extends { id: string; startsAt?: number; endsAt?: number }>(events: T[], now: number = Date.now(), preferredId?: string): T | undefined {
  const preferred = preferredId ? events.find((e) => e.id === preferredId) : undefined;
  if (preferred) return preferred;
  const dated = events.filter((e) => eventWindow(e));
  const live = dated.filter((e) => eventStatus(e, now) === 'upcoming').sort((a, b) => eventWindow(a)!.start - eventWindow(b)!.start);
  if (live.length) return live[0];
  return dated.sort((a, b) => eventWindow(b)!.start - eventWindow(a)!.start)[0] ?? events[0];
}
