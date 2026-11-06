// Pure helpers: turn the raw JSON (snake_case or camelCase) into the shapes the app uses. No React, no I/O.
import type { CampusEvent } from '../data';

export type OrgGroup = 'academic' | 'non-academic';
export interface OrgBoard {
  id: string;
  name: string;            // full name
  shortName: string;
  category: string;        // shown under the name, e.g. "Computing"
  group: OrgGroup;         // the 6 academic / 3 non-academic split
  description: string;
  descriptionVerified: boolean; // only a literal `true` counts as verified
  tags: string[];
  logo?: any;              // bundled asset, or undefined: the card then shows a neutral placeholder (never another org's logo)
  events: CampusEvent[];   // every event of this org, in date order
  featuredEventId?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MANILA = 8 * 3600e3;
export const NEUTRAL = { kind: 'EVENT', icon: '🎟️', bg: '#FDF1C4', campus: 'TIP Quezon City', venue: 'Venue to be announced', about: 'More details for this campus event will be shared by the organizer.' };

const pick = (d: any, ...keys: string[]) => { for (const k of keys) if (d?.[k] !== undefined && d[k] !== null) return d[k]; return undefined; };
const text = (v: any): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const ms = (v: any): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v !== 'string') return undefined;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? undefined : t;
};


// A date without a clock time: "2026-10-28" (one day) or "2024-04" (month only), optionally with date_end. Philippine calendar days.
const DAY_MS = 24 * 3600e3;
const manilaMidnight = (y: number, m: number, d: number) => Date.UTC(y, m, d) - MANILA;
function parseDateOnly(v: any): { y: number; m: number; d?: number } | null {
  const t = text(v); const r = t ? /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(t) : null;
  if (!r) return null;
  const y = +r[1], m = +r[2] - 1, d = r[3] ? +r[3] : undefined;
  if (m < 0 || m > 11) return null;
  if (d !== undefined) { const c = new Date(Date.UTC(y, m, d)); if (c.getUTCMonth() !== m || c.getUTCDate() !== d) return null; }
  return { y, m, d };
}

export function manilaParts(t: number) {
  const d = new Date(t + MANILA);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate(), dow: d.getUTCDay(), h: d.getUTCHours(), min: d.getUTCMinutes() };
}
export const manilaClock = (t: number) => { const p = manilaParts(t); return `${p.h % 12 || 12}:${String(p.min).padStart(2, '0')} ${p.h < 12 ? 'AM' : 'PM'}`; };

// Returns null (and the loader skips the file) when the event has no id or title.
export function normalizeEvent(raw: any, assets: Record<string, any> = {}): CampusEvent | null {
  const id = text(raw?.id), title = text(raw?.title);
  if (!id || !title) return null;
  const startsAt = ms(pick(raw, 'start_at', 'startAt', 'startsAt'));
  const endsAt = ms(pick(raw, 'end_at', 'endAt', 'endsAt'));
  const e: any = {
    id, title,
    kind: text(raw.kind) ?? text(raw.category) ?? NEUTRAL.kind,
    icon: text(raw.icon) ?? NEUTRAL.icon, bg: text(raw.bg) ?? NEUTRAL.bg,
    fee: typeof raw.fee === 'number' ? raw.fee : null,
    venue: text(raw.venue) ?? NEUTRAL.venue, campus: text(raw.campus) ?? NEUTRAL.campus, about: text(raw.about) ?? NEUTRAL.about,
  };
  for (const k of ['address', 'organizer', 'host', 'endTime']) if (text(raw[k])) e[k] = text(raw[k]);
  if (typeof raw.going === 'number') e.going = raw.going;
  if (raw.featured === true) e.featured = true;
  if (startsAt !== undefined) {
    // The clock is derived from the one ISO timestamp so date, time and status can never disagree.
    const p = manilaParts(startsAt);
    e.startsAt = startsAt;
    e.mon = MONTHS[p.m].slice(0, 3).toUpperCase(); e.day = String(p.day).padStart(2, '0');
    e.dateLong = `${WEEKDAYS[p.dow]}, ${MONTHS[p.m]} ${p.day}, ${p.y}`; e.dateShort = `${MONTHS[p.m]} ${p.day}, ${p.y}`;
    e.time = manilaClock(startsAt);
    if (endsAt !== undefined && endsAt > startsAt) { e.endsAt = endsAt; e.endTime = manilaClock(endsAt); }
  } else if (parseDateOnly(raw.date)) {
    // Only a date is known. The clock time is never invented: the organizer's wording (`time`) is shown as written, else "Time to be announced".
    const a = parseDateOnly(raw.date)!, b = parseDateOnly(raw.date_end);
    const time = text(raw.time) ?? 'Time to be announced';
    if (a.d === undefined) {
      // Month only: the event spans that whole month for past/upcoming purposes; the day is shown as "--", never guessed.
      e.startsAt = manilaMidnight(a.y, a.m, 1); e.endsAt = manilaMidnight(a.y, a.m + 1, 1);
      Object.assign(e, { mon: MONTHS[a.m].slice(0, 3).toUpperCase(), day: '--', dateLong: `${MONTHS[a.m]} ${a.y}`, dateShort: `${MONTHS[a.m]} ${a.y}`, time });
    } else {
      const start = manilaMidnight(a.y, a.m, a.d), p = manilaParts(start);
      const endDay = b && b.d !== undefined ? manilaMidnight(b.y, b.m, b.d) : undefined;
      e.startsAt = start;
      const range = endDay !== undefined && endDay > start;
      if (range) e.endsAt = endDay! + DAY_MS; // the last day counts until it ends; a one-day event ends with its day (eventWindow)
      const q = range ? manilaParts(endDay!) : undefined;
      Object.assign(e, {
        mon: MONTHS[p.m].slice(0, 3).toUpperCase(), day: String(p.day).padStart(2, '0'), time,
        dateLong: q ? `${WEEKDAYS[p.dow]}, ${MONTHS[p.m]} ${p.day} to ${WEEKDAYS[q.dow]}, ${MONTHS[q.m]} ${q.day}, ${q.y}` : `${WEEKDAYS[p.dow]}, ${MONTHS[p.m]} ${p.day}, ${p.y}`,
        dateShort: q ? `${MONTHS[p.m]} ${p.day}-${q.m === p.m ? '' : MONTHS[q.m] + ' '}${q.day}, ${q.y}` : `${MONTHS[p.m]} ${p.day}, ${p.y}`,
      });
    }
  } else if (raw.date_tba === true || raw.dateTba === true) {
    // The organizer has not announced a date. Say so; never invent one.
    Object.assign(e, { dateTba: true, mon: 'TBA', day: '--', dateLong: 'Date to be announced', dateShort: 'Date to be announced', time: text(raw.time) ?? 'Time to be announced' });
  } else {
    // Older files carry the display strings directly; without them (and without date_tba) the event is skipped.
    for (const k of ['mon', 'day', 'dateLong', 'dateShort', 'time']) { const v = text(raw[k]); if (!v) return null; e[k] = v; }
  }
  const verified = pick(raw, 'verified_by_human', 'verifiedByHuman');
  if (typeof verified === 'boolean') e.verifiedByHuman = verified;
  const orgId = text(pick(raw, 'organization_id', 'organizationId'));
  if (orgId) e.organizationId = orgId;
  if (assets.poster) e.poster = assets.poster;
  if (assets.image) e.image = assets.image;
  return e as CampusEvent;
}

// Only files that declare a `group` (academic / non-academic) are organizations of the Boards directory.
export function normalizeOrg(raw: any, assets: Record<string, any> = {}, events: CampusEvent[] = []): OrgBoard | null {
  const id = text(raw?.id), group = raw?.group;
  const name = text(pick(raw, 'full_name', 'fullName', 'name'));
  if (!id || !name || (group !== 'academic' && group !== 'non-academic')) return null;
  const description = text(raw.description) ?? '';
  return {
    id, name, group,
    shortName: text(pick(raw, 'short_name', 'shortName')) ?? name,
    category: text(raw.category) ?? (group === 'academic' ? 'Academic' : 'Non-academic'),
    description,
    descriptionVerified: pick(raw, 'description_verified', 'descriptionVerified') === true && description !== '',
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t: any) => typeof t === 'string' && t.trim()).map((t: string) => t.trim()) : [],
    logo: assets.logo,
    events: [...events].sort((a, b) => (a.startsAt ?? 0) - (b.startsAt ?? 0)),
    featuredEventId: text(pick(raw, 'featured_event_id', 'featuredEventId')),
  };
}
