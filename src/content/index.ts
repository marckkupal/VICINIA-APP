// Central content loader. The JSON files under content/organizations/** are the single source of truth for
// organizations and events. Relative image paths in the JSON (logo, poster, image) are resolved to bundled assets by
// tools/build_content_index.py (see generated.ts). Run that script after adding or removing content files.
import type { Board } from '../types';
import type { CampusEvent } from '../data';
import { ORGANIZATION_FILES, EVENT_FILES, type RawEntry } from './generated';
import { normalizeEvent, normalizeOrg, type OrgBoard } from './normalize';

export type { OrgBoard, OrgGroup } from './normalize';

const byOrder = (a: RawEntry, b: RawEntry) => (a.data.order ?? 1e9) - (b.data.order ?? 1e9);
const warn = (path: string, why: string) => { if (typeof console !== 'undefined') console.warn(`[content] skipped ${path}: ${why}`); };

// Keys that belong to the content layer only and are not part of the app's Board shape.
const META = ['order', 'organizationId'];
function cleanBoard(entry: RawEntry): any {
  const out: any = { ...entry.data };
  META.forEach((k) => delete out[k]);
  Object.keys(entry.assets).forEach((k) => { out[k] = entry.assets[k]; });
  return out;
}

// Every event file, normalized, in file order. Duplicate ids are skipped (first one wins).
export function loadEvents(): CampusEvent[] {
  const seen = new Set<string>();
  return [...EVENT_FILES].sort(byOrder).flatMap((e) => {
    const ev = normalizeEvent(e.data, e.assets);
    if (!ev) { warn(e.path, 'needs id, title and a date'); return []; }
    if (seen.has(ev.id)) { warn(e.path, `duplicate id ${ev.id}`); return []; }
    seen.add(ev.id);
    return [ev];
  });
}

// The original starter boards (Boards tab, posts, joining). Files with a `group` are directory organizations, see loadOrgBoards().
export function loadOrganizations(): Board[] {
  const seen = new Set<string>();
  return [...ORGANIZATION_FILES].sort(byOrder).flatMap((e) => {
    const d = e.data;
    if (d.group !== undefined) return [];
    if (typeof d.id !== 'string' || !d.id || typeof d.name !== 'string' || typeof d.emoji !== 'string' || typeof d.members !== 'number') {
      warn(e.path, 'needs id, name, emoji and members'); return [];
    }
    if (seen.has(d.id)) { warn(e.path, `duplicate id ${d.id}`); return []; }
    seen.add(d.id);
    return [cleanBoard(e) as Board];
  });
}

// The organization directory: organizations that declare group "academic" or "non-academic", each with all of its events.
export function loadOrgBoards(): OrgBoard[] {
  const events = loadEvents();
  const seen = new Set<string>();
  return [...ORGANIZATION_FILES].sort(byOrder).flatMap((e) => {
    const org = normalizeOrg(e.data, e.assets, events.filter((ev) => ev.organizationId === e.data.id));
    if (!org) return [];
    if (seen.has(org.id)) { warn(e.path, `duplicate id ${org.id}`); return []; }
    seen.add(org.id);
    return [org];
  });
}

// The events named in FEATURED_EVENT_IDS, in that order. An id with no matching event is skipped with a warning, never invented.
export function pickFeaturedEvents(ids: readonly string[], events: CampusEvent[] = loadEvents()): CampusEvent[] {
  return ids.flatMap((id) => {
    const ev = events.find((x) => x.id === id);
    if (!ev) { warn(id, 'featured event id not found in content'); return []; }
    return [ev];
  });
}
