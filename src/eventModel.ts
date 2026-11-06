import type { CampusEvent } from './data';

// Pure mapping between Firestore `events/{id}` documents and the app's CampusEvent. No network, no React.
//
// Document fields (all optional except title and startsAt):
//   title (string), startsAt (timestamp), endsAt (timestamp), timeTbd (bool: date known, clock time not),
//   category (string), venue (string), address (string), campus (string), about (string), organizer (string),
//   fee (integer pesos; leave out when unknown), host ('guidance' | 'osa'), featured (bool), goingCount (integer),
//   imageUrl (https URL), ownerUid, ownerEmail, createdAt (timestamp)
// A document without a usable title or start date is skipped. Everything else falls back to the neutral text below;
// nothing is invented (no default venue, price, organizer or attendee count).

export const FALLBACK = {
  venue: 'Venue to be announced',
  time: 'Time to be announced',
  about: 'More details for this campus event will be shared by the organizer.',
  kind: 'EVENT',
} as const;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const CATEGORY_STYLE: Record<string, { icon: string; bg: string }> = {
  WORKSHOP: { icon: '🛠️', bg: '#FDF1C4' }, TECHNOLOGY: { icon: '💻', bg: '#E6EDFB' }, ACADEMIC: { icon: '📚', bg: '#E3F0E4' },
  WELLNESS: { icon: '🌿', bg: '#E3F0E4' }, SOCIAL: { icon: '🎉', bg: '#F8E9E5' }, SPORTS: { icon: '🏀', bg: '#E6EDFB' },
  'ARTS & CULTURE': { icon: '🎨', bg: '#EDE6F7' },
};
const NEUTRAL_STYLE = { icon: '🎟️', bg: '#FDF1C4' };

export const clock = (d: Date) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;

const str = (f: any, k: string): string | undefined => {
  const v = f?.[k]?.stringValue;
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};
const int = (f: any, k: string): number | undefined => {
  const raw = f?.[k]?.integerValue ?? f?.[k]?.doubleValue;
  const n = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const when = (f: any, k: string): Date | undefined => {
  const raw = f?.[k]?.timestampValue;
  const d = typeof raw === 'string' ? new Date(raw) : undefined;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
};

export function docToEvent(doc: any): CampusEvent | null {
  const f = doc?.fields;
  const id = typeof doc?.name === 'string' ? doc.name.split('/').pop() : undefined;
  const title = str(f, 'title');
  const start = when(f, 'startsAt');
  if (!id || !title || !start) return null;
  const end = when(f, 'endsAt');
  const tbd = f?.timeTbd?.booleanValue === true;
  const kind = (str(f, 'category') ?? FALLBACK.kind).toUpperCase();
  const style = CATEGORY_STYLE[kind] ?? NEUTRAL_STYLE;
  const full = MONTHS[start.getMonth()];
  const host = str(f, 'host');
  const image = str(f, 'imageUrl');
  const going = int(f, 'goingCount');
  const ev: CampusEvent = {
    id, kind, fee: int(f, 'fee') ?? null, title, icon: style.icon, bg: style.bg,
    mon: full.slice(0, 3).toUpperCase(), day: String(start.getDate()).padStart(2, '0'),
    dateLong: `${WEEKDAYS[start.getDay()]}, ${full} ${start.getDate()}, ${start.getFullYear()}`,
    dateShort: `${full} ${start.getDate()}, ${start.getFullYear()}`,
    time: tbd ? FALLBACK.time : clock(start),
    venue: str(f, 'venue') ?? FALLBACK.venue,
    campus: str(f, 'campus') ?? '',
    about: str(f, 'about') ?? FALLBACK.about,
    startsAt: start.getTime(),
  };
  if (end && !tbd && end > start) ev.endTime = clock(end);
  if (str(f, 'address')) ev.address = str(f, 'address');
  if (str(f, 'organizer')) ev.organizer = str(f, 'organizer');
  if (going) ev.going = going;
  if (f?.featured?.booleanValue === true) ev.featured = true;
  if (host === 'guidance' || host === 'osa') ev.host = host;
  if (image && /^https:\/\//i.test(image)) ev.image = { uri: image };
  return ev;
}

export interface NewEvent {
  title: string; category: string; startsAt: Date; venue: string; fee: number; about?: string;
}

// Fields written by "Post an event". ownerUid is what the Firestore rules check.
export function eventToFields(e: NewEvent, owner: { uid: string; email: string }, now = new Date()) {
  const f: Record<string, any> = {
    title: { stringValue: e.title.trim() },
    category: { stringValue: e.category },
    startsAt: { timestampValue: e.startsAt.toISOString() },
    venue: { stringValue: e.venue.trim() },
    fee: { integerValue: String(Math.max(0, Math.round(e.fee))) },
    ownerUid: { stringValue: owner.uid },
    ownerEmail: { stringValue: owner.email },
    createdAt: { timestampValue: now.toISOString() },
  };
  if (e.about?.trim()) f.about = { stringValue: e.about.trim() };
  return f;
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
export const startMs = (e: CampusEvent): number => e.startsAt ?? new Date(Number(e.dateShort.slice(-4)), MONTHS.findIndex((m) => m.slice(0, 3).toUpperCase() === e.mon), Number(e.day)).getTime();
export const eventDate = (e: CampusEvent) => { const d = new Date(startMs(e)); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
