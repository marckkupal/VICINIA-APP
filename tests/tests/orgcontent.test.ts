// Run: npx tsx tests/orgcontent.test.ts   (pure logic, no React Native needed)
// Every org and event below is a made-up TEST FIXTURE. It proves the rules; it is never shipped content.
import './stubs/images';
import { normalizeEvent, normalizeOrg } from '../src/content/normalize';
import { pickFeaturedEvents } from '../src/content';
import { eventStatus, pickFeatured } from '../src/eventStatus';
import { filterEventsByStatus, filterOrgs, groupOptions, NO_ORG_FILTER, orgEmptyFor, reconcileOrgFilter, statusOf, statusOptions, tagOptions, eventsEmptyFor } from '../src/content/filters';
import { FEATURED_EVENT_IDS } from '../src/featuredEvents';

let fails = 0;
const ok = (name: string, cond: boolean) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`); if (!cond) fails++; };
const T = (iso: string) => new Date(iso).getTime();

// ---- events: one ISO timestamp drives date, time and status
const e1: any = normalizeEvent({ id: 'a', title: 'Alpha', start_at: '2026-11-05T13:00:00+08:00', end_at: '2026-11-05T17:30:00+08:00', verified_by_human: true, organization_id: 'o1' });
ok('date text derived in Manila time', e1.dateLong === 'Thursday, November 5, 2026' && e1.dateShort === 'November 5, 2026' && e1.mon === 'NOV' && e1.day === '05');
ok('clock derived (1:00 PM start, 5:30 PM end)', e1.time === '1:00 PM' && e1.endTime === '5:30 PM');
ok('same instant in UTC gives the same Manila date', normalizeEvent({ id: 'b', title: 'B', start_at: '2026-11-05T05:00:00Z' })!.time === '1:00 PM');
ok('late-night UTC rolls to next Manila day', normalizeEvent({ id: 'c', title: 'C', start_at: '2026-11-04T17:00:00Z' })!.day === '05');
ok('organization_id carried over', e1.organizationId === 'o1');
ok('event without id/title/date is skipped', normalizeEvent({ title: 'x', start_at: '2026-11-05T13:00:00+08:00' }) === null && normalizeEvent({ id: 'x', title: 'x' }) === null);
const tba: any = normalizeEvent({ id: 'tba1', title: 'No date yet', date_tba: true });
ok('date_tba event loads, says so, and has no invented date', !!tba && tba.dateTba === true && tba.startsAt === undefined && tba.dateShort === 'Date to be announced');
ok('nothing invented: missing venue/about use neutral text', e1.venue === 'Venue to be announced' && e1.fee === null);

// ---- date without a clock time (handoff pack events): never an invented time, status still works
const d1: any = normalizeEvent({ id: 'd1', title: 'Day only', date: '2026-10-28', time: 'Morning and afternoon sessions' });
ok('date-only: date text in Manila time, poster wording kept as the time', d1.dateLong === 'Wednesday, October 28, 2026' && d1.mon === 'OCT' && d1.day === '28' && d1.time === 'Morning and afternoon sessions');
ok('date-only without time says so, never a clock time', normalizeEvent({ id: 'd2', title: 'x', date: '2026-10-28' })!.time === 'Time to be announced');
ok('date-only: upcoming all day, past the next day', eventStatus(d1, T('2026-10-28T23:59:00+08:00')) === 'upcoming' && eventStatus(d1, T('2026-10-29T00:00:00+08:00')) === 'past');
const multi: any = normalizeEvent({ id: 'd3', title: 'Two days', date: '2026-10-08', date_end: '2026-10-09' });
ok('multi-day: range text, still upcoming on the last day, past after it', multi.dateLong === 'Thursday, October 8 to Friday, October 9, 2026' && multi.dateShort === 'October 8-9, 2026' && eventStatus(multi, T('2026-10-09T20:00:00+08:00')) === 'upcoming' && eventStatus(multi, T('2026-10-10T00:00:00+08:00')) === 'past');
const mo: any = normalizeEvent({ id: 'd4', title: 'Month only', date: '2024-04' });
ok('month-only: month shown, day is "--" (no day guessed), past', mo.dateLong === 'April 2024' && mo.day === '--' && mo.mon === 'APR' && eventStatus(mo, T('2026-10-29T00:00:00+08:00')) === 'past');
ok('month-only is not past while that month is running', eventStatus(mo, T('2024-04-30T23:00:00+08:00')) === 'upcoming');
ok('impossible dates are rejected, not rolled over', normalizeEvent({ id: 'd5', title: 'x', date: '2026-02-30' }) === null && normalizeEvent({ id: 'd6', title: 'x', date: '2026-13' }) === null);
ok('date null + date_tba loads as Date TBA', (normalizeEvent({ id: 'd7', title: 'x', date: null, date_tba: true }) as any).dateTba === true);

// ---- verified_by_human: only a literal true counts as confirmed
ok('verified true kept', e1.verifiedByHuman === true);
ok('verified false kept', normalizeEvent({ id: 'v', title: 'V', start_at: '2026-11-05T13:00:00+08:00', verified_by_human: false })!.verifiedByHuman === false);
ok('verified missing stays undefined (UI treats it as unconfirmed)', normalizeEvent({ id: 'w', title: 'W', start_at: '2026-11-05T13:00:00+08:00' })!.verifiedByHuman === undefined);

// ---- Past / upcoming, computed from "now"
const w = { startsAt: T('2026-11-05T13:00:00+08:00'), endsAt: T('2026-11-05T17:00:00+08:00') };
ok('before start = upcoming', eventStatus(w, T('2026-11-05T12:59:00+08:00')) === 'upcoming');
ok('at start = upcoming (not over yet)', eventStatus(w, T('2026-11-05T13:00:00+08:00')) === 'upcoming');
ok('after end = past', eventStatus(w, T('2026-11-05T17:00:00+08:00')) === 'past');
const noEnd = { startsAt: T('2026-11-05T13:00:00+08:00') };
ok('no end time: still upcoming at 11:59 PM that day', eventStatus(noEnd, T('2026-11-05T23:59:00+08:00')) === 'upcoming');
ok('no end time: past at midnight', eventStatus(noEnd, T('2026-11-06T00:00:00+08:00')) === 'past');
ok('same event flips as the clock moves (render-time, not stored)', eventStatus(noEnd, T('2026-10-01T00:00:00+08:00')) === 'upcoming' && eventStatus(noEnd, T('2027-01-01T00:00:00+08:00')) === 'past');
ok('no date at all = Date TBA (nothing guessed)', eventStatus({}, Date.now()) === 'tba');
ok('legacy date-only event covered by fallback start', eventStatus({}, T('2026-11-05T12:00:00+08:00'), T('2026-11-05T00:00:00+08:00')) === 'upcoming');

// ---- organizations
const base = { id: 'o1', group: 'academic', full_name: 'Org One', short_name: 'O1', category: 'Computing', description: 'We code.', description_verified: true, tags: ['code', ' ', 'web'] };
const o1 = normalizeOrg(base, { logo: 7 }, [e1])!;
ok('names, category, tags (blank tag dropped)', o1.name === 'Org One' && o1.shortName === 'O1' && o1.category === 'Computing' && o1.tags.join() === 'code,web');
ok('verified description shown as verified', o1.descriptionVerified === true);
ok('description_verified false => pending', normalizeOrg({ ...base, description_verified: false }, {}, [])!.descriptionVerified === false);
ok('description_verified missing => pending', normalizeOrg({ ...base, description_verified: undefined }, {}, [])!.descriptionVerified === false);
ok('verified but empty description => pending', normalizeOrg({ ...base, description: '' }, {}, [])!.descriptionVerified === false);
ok('org without group is not a directory organization', normalizeOrg({ ...base, group: undefined }, {}, []) === null && normalizeOrg({ ...base, group: 'other' }, {}, []) === null);
ok('missing logo stays undefined, never borrowed from another org', normalizeOrg({ ...base, id: 'o2' }, {}, [])!.logo === undefined && o1.logo === 7);
ok('short name falls back to full name', normalizeOrg({ ...base, short_name: undefined }, {}, [])!.shortName === 'Org One');
ok('camelCase keys accepted too', normalizeOrg({ id: 'o3', group: 'non-academic', fullName: 'Three', shortName: 'T', descriptionVerified: true, description: 'd' }, {}, [])!.descriptionVerified === true);

// ---- the org's featured event
const past = normalizeEvent({ id: 'p', title: 'Past', start_at: '2026-01-10T10:00:00+08:00' })!;
const next = normalizeEvent({ id: 'n', title: 'Next', start_at: '2026-12-01T10:00:00+08:00' })!;
const later = normalizeEvent({ id: 'l', title: 'Later', start_at: '2026-12-20T10:00:00+08:00' })!;
const now = T('2026-11-20T09:00:00+08:00');
ok('featured = next upcoming event', pickFeatured([past, later, next], now)!.id === 'n');
ok('all past: most recent one', pickFeatured([past, normalizeEvent({ id: 'q', title: 'Q', start_at: '2026-03-10T10:00:00+08:00' })!], now)!.id === 'q');
ok('preferred featured_event_id wins when it exists', pickFeatured([past, next], now, 'p')!.id === 'p');
ok('unknown preferred id falls back to the rule', pickFeatured([past, next], now, 'nope')!.id === 'n');
ok('no events => nothing featured', pickFeatured([], now) === undefined);
ok('org keeps ALL its events, in date order', normalizeOrg(base, {}, [later, past, next])!.events.map((e) => e.id).join() === 'p,n,l');

// ---- Events page: exactly the configured ids, in order
ok('config lists exactly 4 distinct ids', FEATURED_EVENT_IDS.length === 4 && new Set(FEATURED_EVENT_IDS).size === 4);
ok('config ids are the required four', FEATURED_EVENT_IDS.join() === 'valorant-summit-5v5,code-relay-2026,datastream-jacked-into-the-grid,rgc-review-group-conference');
const pool = [...FEATURED_EVENT_IDS].reverse().concat(['extra-1', 'extra-2']).map((id) => normalizeEvent({ id, title: id, start_at: '2026-12-01T10:00:00+08:00' })!);
const shown = pickFeaturedEvents(FEATURED_EVENT_IDS, pool);
ok('picks exactly 4 even when more events exist', shown.length === 4);
ok('keeps the order set in the config, not file order', shown.map((e) => e.id).join() === FEATURED_EVENT_IDS.join());
const origWarn = console.warn; console.warn = () => {};
ok('a missing id is skipped, nothing invented', pickFeaturedEvents(FEATURED_EVENT_IDS, pool.slice(0, 2)).length === 2);
console.warn = origWarn;

// ---- Prompt 5: filters, tags and dropdowns come only from the loaded data
const mk = (id: string, group: any, tags: string[]) => normalizeOrg({ id, group, full_name: id, short_name: id, category: 'c', description: 'd', description_verified: true, tags }, {}, [])!;
const orgs = [mk('a1', 'academic', ['Code', 'web']), mk('a2', 'academic', ['code', 'AI']), mk('n1', 'non-academic', ['music', 'Code'])];
const gOpts = groupOptions(orgs);
ok('categories are exactly All / Academic / Non-academic with counts', gOpts.map((o) => `${o.label}:${o.count}`).join() === 'All:3,Academic:2,Non-academic:1');
ok('tags derived from data, case-insensitive, most used first', tagOptions(orgs).map((t) => `${t.label}:${t.count}`).join() === 'Code:3,AI:1,music:1,web:1');
ok('tags follow the chosen category', tagOptions(orgs, 'non-academic').map((t) => t.key).join() === 'code,music');
ok('no tag appears that no organization has', !tagOptions(orgs).some((t) => /guild/i.test(t.label)));
ok('filter by category', filterOrgs(orgs, { group: 'academic', tag: null }).map((o) => o.id).join() === 'a1,a2');
ok('filter by tag ignores case', filterOrgs(orgs, { group: 'all', tag: 'CODE' }).length === 3);
ok('category + tag combine', filterOrgs(orgs, { group: 'non-academic', tag: 'web' }).length === 0);
ok('stale tag is dropped when the category changes', reconcileOrgFilter(orgs, { group: 'non-academic', tag: 'web' }).tag === null && reconcileOrgFilter(orgs, { group: 'academic', tag: 'web' }).tag === 'web');
ok('empty: no organizations at all', orgEmptyFor([], NO_ORG_FILTER)!.canClear === false && orgEmptyFor([], NO_ORG_FILTER)!.title === 'No organizations yet');
ok('empty: filters match nothing => message + can clear', orgEmptyFor(orgs, { group: 'non-academic', tag: 'web' })!.canClear === true);
ok('no empty message when something matches', orgEmptyFor(orgs, { group: 'academic', tag: null }) === null);
ok('no tags in data => no tag chips', tagOptions([mk('z', 'academic', [])]).length === 0);

const nowF = T('2026-11-20T09:00:00+08:00');
const evs = [past, next, tba] as any[];
const sOpts = statusOptions(evs, nowF);
ok('statuses are exactly All / Upcoming / Past / Date TBA with counts', sOpts.map((o) => `${o.label}:${o.count}`).join() === 'All:3,Upcoming:1,Past:1,Date TBA:1');
ok('a status with no events still listed with 0', statusOptions([past], nowF).map((o) => `${o.label}:${o.count}`).join() === 'All:1,Upcoming:0,Past:1,Date TBA:0');
ok('statusOf: TBA flag wins, dated events use the clock', statusOf(tba, nowF) === 'tba' && statusOf(past, nowF) === 'past' && statusOf(next, nowF) === 'upcoming');
ok('status filter keeps only that status', filterEventsByStatus(evs, 'past', nowF).map((e) => e.id).join() === 'p' && filterEventsByStatus(evs, 'tba', nowF).map((e) => e.id).join() === 'tba1');
ok('same events re-sort into Past as time passes', statusOf(next, T('2027-02-01T00:00:00+08:00')) === 'past');
ok('empty status filter explains itself and can be cleared', eventsEmptyFor([next], 'past', nowF)!.title === 'No Past events' && eventsEmptyFor([next], 'past', nowF)!.canClear);
ok('no events at all => cannot clear, plain message', eventsEmptyFor([], 'all', nowF)!.canClear === false);
ok('events exist => no empty message', eventsEmptyFor(evs, 'all', nowF) === null);

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
