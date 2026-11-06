// Filter, tag and dropdown options for the Boards and Events pages. Everything here is DERIVED from the loaded JSON:
// no option list is typed in by hand, so a category, tag or status that has no data behind it can never appear (and a new one appears by itself).
import type { CampusEvent } from '../data';
import { eventStatus, STATUS_LABEL, STATUS_ORDER, type EventStatus } from '../eventStatus';
import { startMs } from '../eventModel';
import type { OrgBoard, OrgGroup } from './normalize';

export const GROUP_LABEL: Record<OrgGroup, string> = { academic: 'Academic', 'non-academic': 'Non-academic' };
export const GROUP_ORDER: OrgGroup[] = ['academic', 'non-academic'];

export interface Option<K extends string = string> { key: K; label: string; count: number }
export interface Empty { title: string; body: string; canClear: boolean }

// ---------- Boards: Academic / Non-academic + tags ----------
export type GroupFilter = 'all' | OrgGroup;
export interface OrgFilter { group: GroupFilter; tag: string | null }
export const NO_ORG_FILTER: OrgFilter = { group: 'all', tag: null };

export function groupOptions(orgs: OrgBoard[]): Option<GroupFilter>[] {
  return [
    { key: 'all', label: 'All', count: orgs.length },
    ...GROUP_ORDER.map((g) => ({ key: g as GroupFilter, label: GROUP_LABEL[g], count: orgs.filter((o) => o.group === g).length })),
  ];
}

const norm = (t: string) => t.trim().toLowerCase();

// Tags that exist among the organizations of the chosen category, most used first. "Code" and "code" count as one tag.
export function tagOptions(orgs: OrgBoard[], group: GroupFilter = 'all'): Option[] {
  const seen = new Map<string, Option>();
  for (const o of orgs) {
    if (group !== 'all' && o.group !== group) continue;
    for (const t of new Set(o.tags.map(norm))) {
      const label = o.tags.find((x) => norm(x) === t)!;
      const cur = seen.get(t);
      if (cur) cur.count++; else seen.set(t, { key: t, label, count: 1 });
    }
  }
  return [...seen.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function filterOrgs(orgs: OrgBoard[], f: OrgFilter): OrgBoard[] {
  return orgs.filter((o) => (f.group === 'all' || o.group === f.group) && (!f.tag || o.tags.some((t) => norm(t) === norm(f.tag!))));
}

// A selected tag that no longer exists (data changed, or another category was picked) is dropped instead of leaving an empty page nobody can explain.
export function reconcileOrgFilter(orgs: OrgBoard[], f: OrgFilter): OrgFilter {
  if (f.tag && !tagOptions(orgs, f.group).some((t) => t.key === norm(f.tag!))) return { ...f, tag: null };
  return f;
}

export function orgEmptyFor(orgs: OrgBoard[], f: OrgFilter): Empty | null {
  if (filterOrgs(orgs, f).length > 0) return null;
  if (orgs.length === 0) return { title: 'No organizations yet', body: 'Student organizations will appear here once they are added.', canClear: false };
  const parts = [f.group !== 'all' ? GROUP_LABEL[f.group] : '', f.tag ? `tagged “${f.tag}”` : ''].filter(Boolean).join(' ');
  return { title: 'No organizations match', body: `There are no ${parts || 'matching'} organizations. Try another category or tag.`, canClear: true };
}

// ---------- Events: Past / Upcoming / Date TBA ----------
export type StatusFilter = 'all' | EventStatus;
const safeStart = (e: CampusEvent) => { try { const t = startMs(e); return Number.isFinite(t) ? t : undefined; } catch { return undefined; } };
export const statusOf = (e: CampusEvent, now: number): EventStatus => (e.dateTba ? 'tba' : eventStatus(e, now, safeStart(e)));

// Always the same three statuses plus All, with live counts; a status with no events shows 0 rather than disappearing.
export function statusOptions(events: CampusEvent[], now: number): Option<StatusFilter>[] {
  return [
    { key: 'all', label: 'All', count: events.length },
    ...STATUS_ORDER.map((st) => ({ key: st as StatusFilter, label: STATUS_LABEL[st], count: events.filter((e) => statusOf(e, now) === st).length })),
  ];
}
export const filterEventsByStatus = (events: CampusEvent[], f: StatusFilter, now: number) => (f === 'all' ? events : events.filter((e) => statusOf(e, now) === f));

export function eventsEmptyFor(events: CampusEvent[], f: StatusFilter, now: number): Empty | null {
  if (filterEventsByStatus(events, f, now).length > 0) return null;
  if (events.length === 0) return { title: 'No events yet', body: 'Nothing is listed here yet.', canClear: false };
  const word = f === 'all' ? '' : STATUS_LABEL[f as EventStatus];
  return { title: `No ${word} events`.replace('  ', ' '), body: f === 'tba' ? 'Every event here has a date.' : f === 'past' ? 'None of these events have happened yet.' : 'None of these events are coming up.', canClear: true };
}
