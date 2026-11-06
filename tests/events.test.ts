// Events: data model, Firestore access, feed states (loading / empty / error / stale), filtering, and posting.
// Runs the real eventModel, eventsApi, eventsStore, eventsView and auth modules against a fake Firestore (fetch is stubbed).
//   export NODE_PATH=$PWD/tests/stubs:$(npm root -g) && rm -f /tmp/events-store.json && VERIFY_STORE=/tmp/events-store.json npx tsx tests/events.test.ts
import assert from 'node:assert/strict';
import { docToEvent, eventToFields, FALLBACK } from '../src/eventModel';
import { createEvent, eventsConfig, fetchEvents, friendlyEventsError } from '../src/eventsApi';
import { createEventsFeed } from '../src/eventsStore';
import { categoriesOf, pageMode, selectEvents, startOfDay } from '../src/eventsView';
import { logIn } from '../src/auth';
import type { CampusEvent } from '../src/data';

let passed = 0;
const test = async (name: string, fn: () => unknown | Promise<unknown>) => { await fn(); passed++; console.log('  ok  ' + name); };

/* ---------- fake Firestore ---------- */
type Doc = { name: string; fields: Record<string, any> };
const P = 'projects/viciniaapp-35edd/databases/(default)/documents/events/';
const ts = (iso: string) => ({ timestampValue: iso });
const s = (v: string) => ({ stringValue: v });
const mk = (id: string, iso: string, extra: Record<string, any> = {}): Doc => ({ name: P + id, fields: { title: s('Event ' + id), startsAt: ts(iso), ...extra } });
const fb = {
  docs: [] as Doc[], calls: [] as { method: string; url: string; auth?: string; body?: any }[],
  fault: null as null | 'network' | 'http500' | 'http403' | 'hang' | 'garbage' | 'dropWrite', requireAuth: false, delay: 0,
};
const reply = (status: number, body: any) => ({ ok: status < 400, status, json: async () => body }) as any;
(globalThis as any).fetch = async (url: string, init: any = {}) => {
  const method = init.method ?? 'GET';
  const auth = init.headers?.Authorization;
  const body = typeof init.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : init.body;
  fb.calls.push({ method, url, auth, body });
  if (url.includes('accounts:signInWithPassword')) return reply(200, { idToken: 'id1', refreshToken: 'r1', localId: 'uid1', displayName: 'Marck' });
  if (url.includes('accounts:lookup')) return reply(200, { users: [{ emailVerified: true }] });
  if (url.includes('securetoken')) return reply(200, { id_token: 'fresh-token', refresh_token: 'r2' });
  if (!url.includes('/documents')) throw new Error('unexpected ' + url);
  if (fb.fault === 'network') throw new TypeError('Network request failed');
  if (fb.fault === 'hang') return new Promise((_, rej) => init.signal?.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
  if (fb.fault === 'http500') return reply(500, { error: { status: 'INTERNAL' } });
  if (fb.fault === 'http403') return reply(403, [{ error: { status: 'PERMISSION_DENIED' } }]);
  if (fb.fault === 'garbage') return reply(200, { not: 'an array' });
  if (fb.delay) await new Promise((r) => setTimeout(r, fb.delay));
  if (fb.requireAuth && !auth) return reply(403, { error: { status: 'PERMISSION_DENIED' } });
  if (url.includes(':runQuery')) {
    const since = body.structuredQuery.where.fieldFilter.value.timestampValue;
    const hits = fb.docs.filter((d) => d.fields.startsAt?.timestampValue >= since).sort((a, b) => a.fields.startsAt.timestampValue.localeCompare(b.fields.startsAt.timestampValue));
    return reply(200, hits.length ? hits.map((document) => ({ document, readTime: 'x' })) : [{ readTime: 'x' }]); // Firestore sends one empty row when nothing matches
  }
  if (method === 'POST' && url.includes('/documents/events')) {
    if (!auth) return reply(403, { error: { status: 'PERMISSION_DENIED' } });
    if (body.fields.ownerUid?.stringValue !== 'uid1') return reply(403, { error: { status: 'PERMISSION_DENIED' } }); // rule: ownerUid must be the caller
    const doc = { name: P + 'new' + (fb.docs.length + 1), fields: fb.fault === 'dropWrite' ? { ...body.fields, title: s('other') } : body.fields };
    fb.docs.push(doc);
    return reply(200, doc);
  }
  throw new Error('unexpected ' + method + ' ' + url);
};
const reset = () => { fb.docs = []; fb.calls.length = 0; fb.fault = null; fb.requireAuth = false; fb.delay = 0; };
const inDays = (n: number, h = 14) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d.toISOString(); };

const ev = (over: Partial<CampusEvent> & { id: string }): CampusEvent => ({
  kind: 'EVENT', fee: null, title: 'T ' + over.id, icon: '🎟️', bg: '#FDF1C4', mon: 'JAN', day: '01', dateLong: '', dateShort: 'January 1, 2026',
  time: '1:00 PM', venue: 'V', campus: '', about: '', startsAt: Date.now() + 86400000, ...over,
});

(async () => {
  console.log('Data model');
  await test('maps a full document to a CampusEvent', () => {
    const e = docToEvent(mk('a', '2026-10-08T02:00:00Z', {
      category: s('Technology'), venue: s('Room 201'), address: s('1 Main St'), organizer: s('IT Society'), fee: { integerValue: '150' },
      endsAt: ts('2026-10-08T05:30:00Z'), goingCount: { integerValue: '42' }, featured: { booleanValue: true }, host: s('guidance'), imageUrl: s('https://x.test/a.jpg'),
    }))!;
    assert.equal(e.id, 'a'); assert.equal(e.title, 'Event a'); assert.equal(e.kind, 'TECHNOLOGY'); assert.equal(e.icon, '💻');
    assert.equal(e.fee, 150); assert.equal(e.venue, 'Room 201'); assert.equal(e.address, '1 Main St'); assert.equal(e.organizer, 'IT Society');
    assert.equal(e.going, 42); assert.equal(e.featured, true); assert.equal(e.host, 'guidance'); assert.deepEqual(e.image, { uri: 'https://x.test/a.jpg' });
    assert.equal(e.startsAt, Date.parse('2026-10-08T02:00:00Z')); assert.match(e.time, /^\d{1,2}:\d{2} (AM|PM)$/); assert.match(e.endTime!, /^\d{1,2}:\d{2} (AM|PM)$/);
    assert.match(e.dateLong, /^\w+day, \w+ \d+, \d{4}$/);
  });
  await test('missing optional fields use neutral fallbacks and invent nothing', () => {
    const e = docToEvent(mk('b', '2026-10-08T02:00:00Z'))!;
    assert.equal(e.venue, FALLBACK.venue); assert.equal(e.about, FALLBACK.about); assert.equal(e.kind, 'EVENT');
    assert.equal(e.fee, null, 'unknown fee is null, not 0 / Free');
    for (const k of ['organizer', 'address', 'going', 'featured', 'host', 'image', 'endTime'] as const) assert.equal(e[k], undefined, k);
    assert.equal(e.campus, '');
  });
  await test('timeTbd shows a neutral time, and endsAt is ignored', () => {
    const e = docToEvent(mk('c', '2026-10-08T02:00:00Z', { timeTbd: { booleanValue: true }, endsAt: ts('2026-10-08T05:00:00Z') }))!;
    assert.equal(e.time, FALLBACK.time); assert.equal(e.endTime, undefined);
  });
  await test('bad documents are rejected or sanitised', () => {
    assert.equal(docToEvent(null), null);
    assert.equal(docToEvent({ name: P + 'x', fields: { startsAt: ts('2026-10-08T02:00:00Z') } }), null, 'no title');
    assert.equal(docToEvent({ name: P + 'x', fields: { title: s('  ') , startsAt: ts('2026-10-08T02:00:00Z') } }), null, 'blank title');
    assert.equal(docToEvent({ name: P + 'x', fields: { title: s('T') } }), null, 'no date');
    assert.equal(docToEvent({ name: P + 'x', fields: { title: s('T'), startsAt: ts('nonsense') } }), null, 'bad date');
    assert.equal(docToEvent({ fields: { title: s('T'), startsAt: ts('2026-10-08T02:00:00Z') } }), null, 'no id');
    const e = docToEvent(mk('d', '2026-10-08T02:00:00Z', { imageUrl: s('http://insecure.test/a.jpg'), fee: { integerValue: '-5' }, host: s('hacker'), goingCount: { integerValue: '0' } }))!;
    assert.equal(e.image, undefined, 'only https images'); assert.equal(e.fee, null, 'negative fee ignored'); assert.equal(e.host, undefined); assert.equal(e.going, undefined);
  });
  await test('new-event fields carry the owner and only what was entered', () => {
    const f = eventToFields({ title: ' Hi ', category: 'Social', startsAt: new Date('2026-10-08T02:00:00Z'), venue: ' Hall ', fee: 0 }, { uid: 'u1', email: 'a@b.c' }, new Date('2026-10-01T00:00:00Z'));
    assert.equal(f.title.stringValue, 'Hi'); assert.equal(f.venue.stringValue, 'Hall'); assert.equal(f.ownerUid.stringValue, 'u1'); assert.equal(f.fee.integerValue, '0');
    assert.equal(f.about, undefined, 'blank about is not stored');
  });

  console.log('Firestore access');
  await test('fetchEvents returns documents in order and skips unreadable ones', async () => {
    reset();
    fb.docs = [mk('late', inDays(9)), mk('soon', inDays(2)), { name: P + 'broken', fields: { startsAt: ts(inDays(5)) } }]; // a document without a title is skipped, not shown as a blank card
    const r = await fetchEvents();
    assert.deepEqual(r.events.map((e) => e.id), ['soon', 'late']); assert.equal(r.skipped, 1);
  });
  await test('an empty collection is an empty list, not an error', async () => {
    reset();
    const r = await fetchEvents(); assert.deepEqual(r, { events: [], skipped: 0 });
  });
  await test('events older than the window are not requested', async () => {
    reset(); fb.docs = [mk('ancient', '2020-01-01T00:00:00Z'), mk('new', inDays(1))];
    assert.deepEqual((await fetchEvents()).events.map((e) => e.id), ['new']);
  });
  for (const [fault, code, msg] of [['network', 'events/network', /internet/i], ['http500', 'unavailable', /temporarily/i], ['http403', 'permission-denied', /not allowed/i], ['garbage', 'events/bad-response', /format/i]] as const) {
    await test(`fetch failure "${fault}" gives code ${code} and a readable message`, async () => {
      reset(); fb.fault = fault;
      await assert.rejects(fetchEvents(), (e: any) => e.code === code && msg.test(friendlyEventsError(e)));
    });
  }
  await test('a request that never answers times out instead of loading forever', async () => {
    reset(); fb.fault = 'hang'; eventsConfig.timeoutMs = 40;
    try { await assert.rejects(fetchEvents(), (e: any) => e.code === 'events/timeout'); } finally { eventsConfig.timeoutMs = 15000; }
  });
  await test('signed out: reads send no token; posting says to log in', async () => {
    reset(); fb.docs = [mk('a', inDays(1))];
    await fetchEvents(); assert.equal(fb.calls.at(-1)!.auth, undefined);
    await assert.rejects(createEvent({ title: 'X', category: 'Social', startsAt: new Date(), venue: 'V', fee: 0 }), (e: any) => e.code === 'auth/no-session' && /log in/i.test(friendlyEventsError(e)));
    assert.equal(fb.calls.filter((c) => c.method === 'POST' && c.url.includes('/events')).length, 0, 'nothing was sent');
  });
  await logIn('marck@tip.edu.ph', 'secret123');
  await test('signed in: reads and writes carry a fresh token', async () => {
    reset(); fb.docs = [mk('a', inDays(1))]; fb.requireAuth = true;
    assert.equal((await fetchEvents()).events.length, 1); assert.equal(fb.calls.at(-1)!.auth, 'Bearer fresh-token');
  });
  await test('posting stores the event and returns what the server holds', async () => {
    reset();
    const start = new Date(); start.setDate(start.getDate() + 3); start.setHours(15, 30, 0, 0);
    const e = await createEvent({ title: ' Photo walk ', category: 'Social', startsAt: start, venue: 'Quad', fee: 0, about: 'Bring a camera' });
    assert.equal(e.title, 'Photo walk'); assert.equal(e.time, '3:30 PM'); assert.equal(e.fee, 0); assert.equal(e.about, 'Bring a camera');
    assert.equal(fb.docs.length, 1); assert.equal(fb.docs[0].fields.ownerUid.stringValue, 'uid1');
  });
  await test('a write the server accepted but did not store is reported as failed', async () => {
    reset(); fb.fault = 'dropWrite';
    await assert.rejects(createEvent({ title: 'Real title', category: 'Social', startsAt: new Date(Date.now() + 1e8), venue: 'V', fee: 0 }), (e: any) => e.code === 'firestore/not-persisted');
  });
  await test('posting failures surface (network, rules)', async () => {
    reset(); fb.fault = 'network';
    await assert.rejects(createEvent({ title: 'X', category: 'Social', startsAt: new Date(), venue: 'V', fee: 0 }), (e: any) => e.code === 'events/network');
    reset(); fb.fault = 'http403';
    await assert.rejects(createEvent({ title: 'X', category: 'Social', startsAt: new Date(), venue: 'V', fee: 0 }), (e: any) => e.code === 'permission-denied');
  });

  console.log('Feed states');
  const makeFeed = (over: Partial<Parameters<typeof createEventsFeed>[0]> = {}) => {
    let cache: { events: CampusEvent[] } | null = null; let clock = 1000;
    const feed = createEventsFeed({ fetch: () => fetchEvents(), loadCache: async () => cache, saveCache: async (events) => { cache = { events }; }, now: () => clock, ...over });
    return { feed, setCache: (c: any) => { cache = c; }, getCache: () => cache, tick: (ms: number) => { clock += ms; } };
  };
  await test('idle -> loading -> ready with events', async () => {
    reset(); fb.docs = [mk('a', inDays(1))]; fb.delay = 20;
    const { feed } = makeFeed(); const seen: string[] = []; feed.subscribe(() => seen.push(feed.getState().status));
    assert.equal(feed.getState().status, 'idle');
    const p = feed.refresh(); assert.equal(feed.getState().status, 'loading'); assert.equal(feed.getState().refreshing, true);
    await p; assert.equal(feed.getState().status, 'ready'); assert.equal(feed.getState().events.length, 1); assert.equal(feed.getState().refreshing, false);
    assert.ok(seen.includes('loading') && seen.at(-1) === 'ready');
  });
  await test('empty server -> ready with no events (the "no upcoming events" state, not an error)', async () => {
    reset(); const { feed } = makeFeed(); await feed.refresh();
    assert.equal(feed.getState().status, 'ready'); assert.deepEqual(feed.getState().events, []); assert.equal(feed.getState().error, null);
  });
  await test('failure with nothing saved -> error, then Retry recovers', async () => {
    reset(); fb.fault = 'network'; const { feed } = makeFeed(); await feed.refresh();
    assert.equal(feed.getState().status, 'error'); assert.equal(feed.getState().error.code, 'events/network');
    fb.fault = null; fb.docs = [mk('a', inDays(1))]; await feed.refresh();
    assert.equal(feed.getState().status, 'ready'); assert.equal(feed.getState().error, null); assert.equal(feed.getState().events.length, 1);
  });
  await test('failure with a saved copy keeps showing it (stale) and flags the error', async () => {
    reset(); fb.fault = 'http500';
    const h = makeFeed(); h.setCache({ events: [ev({ id: 'cached' })] });
    await h.feed.refresh();
    assert.equal(h.feed.getState().status, 'ready'); assert.equal(h.feed.getState().events[0].id, 'cached'); assert.equal(h.feed.getState().error.code, 'unavailable');
  });
  await test('a failed refresh after a good load does not wipe the list', async () => {
    reset(); fb.docs = [mk('a', inDays(1))]; const { feed } = makeFeed(); await feed.refresh();
    fb.fault = 'network'; await feed.refresh();
    assert.equal(feed.getState().events.length, 1); assert.equal(feed.getState().status, 'ready'); assert.ok(feed.getState().error);
  });
  await test('a good load is saved for next time; server data replaces the saved copy', async () => {
    reset(); fb.docs = [mk('fresh', inDays(1))]; const h = makeFeed(); h.setCache({ events: [ev({ id: 'old' })] });
    await h.feed.refresh();
    assert.deepEqual(h.feed.getState().events.map((e) => e.id), ['fresh']); assert.deepEqual(h.getCache()!.events.map((e) => e.id), ['fresh']);
  });
  await test('overlapping refresh calls share one request', async () => {
    reset(); fb.docs = [mk('a', inDays(1))]; fb.delay = 20; const { feed } = makeFeed();
    await Promise.all([feed.refresh(), feed.refresh(), feed.ensureFresh()]);
    assert.equal(fb.calls.filter((c) => c.url.includes(':runQuery')).length, 1);
  });
  await test('ensureFresh skips a recent load, reloads a stale or failed one', async () => {
    reset(); fb.docs = [mk('a', inDays(1))]; const h = makeFeed(); await h.feed.ensureFresh();
    const n = () => fb.calls.filter((c) => c.url.includes(':runQuery')).length;
    await h.feed.ensureFresh(); assert.equal(n(), 1, 'fresh');
    h.tick(61_000); await h.feed.ensureFresh(); assert.equal(n(), 2, 'stale');
    fb.fault = 'network'; await h.feed.refresh(); const before = n(); fb.fault = null; await h.feed.ensureFresh(); assert.equal(n(), before + 1, 'after an error');
  });
  await test('data changes on the server show up on the next refresh (nothing is hard-coded)', async () => {
    reset(); fb.docs = [mk('a', inDays(1))]; const { feed } = makeFeed(); await feed.refresh();
    fb.docs.push(mk('b', inDays(2)), mk('c', inDays(3))); fb.docs = fb.docs.filter((d) => !d.name.endsWith('/a'));
    await feed.refresh(); assert.deepEqual(feed.getState().events.map((e) => e.id), ['b', 'c']);
  });
  await test('upsert adds a confirmed event in date order and replaces by id', async () => {
    reset(); fb.docs = [mk('a', inDays(1)), mk('z', inDays(9))]; const { feed } = makeFeed(); await feed.refresh();
    feed.upsert(ev({ id: 'm', startsAt: Date.parse(inDays(5)) })); assert.deepEqual(feed.getState().events.map((e) => e.id), ['a', 'm', 'z']);
    feed.upsert(ev({ id: 'm', title: 'Renamed', startsAt: Date.parse(inDays(5)) })); assert.equal(feed.getState().events.length, 3); assert.equal(feed.getState().events[1].title, 'Renamed');
  });

  console.log('Page states and filters');
  const today = startOfDay(new Date());
  const at = (n: number, extra: Partial<CampusEvent> = {}, id = 'e' + n + Math.random().toString(36).slice(2, 5)) => ev({ id, startsAt: Date.parse(inDays(n)), ...extra });
  const base = { filter: 'For you' as const, category: null, sel: today, today };
  await test('pageMode: loading, error, empty, noMatch, list', () => {
    assert.equal(pageMode({ status: 'idle', scope: [], today, upcomingCount: 0, plain: false }), 'loading');
    assert.equal(pageMode({ status: 'loading', scope: [], today, upcomingCount: 0, plain: false }), 'loading');
    assert.equal(pageMode({ status: 'error', scope: [], today, upcomingCount: 0, plain: false }), 'error');
    assert.equal(pageMode({ status: 'ready', scope: [], today, upcomingCount: 0, plain: false }), 'empty');
    assert.equal(pageMode({ status: 'ready', scope: [at(-3)], today, upcomingCount: 0, plain: false }), 'empty', 'only past events = no upcoming events');
    assert.equal(pageMode({ status: 'ready', scope: [at(2)], today, upcomingCount: 0, plain: false }), 'noMatch');
    assert.equal(pageMode({ status: 'ready', scope: [at(2)], today, upcomingCount: 1, plain: false }), 'list');
    assert.equal(pageMode({ status: 'ready', scope: [at(-3)], today, upcomingCount: 0, plain: true }), 'list', 'simple lists (My events) include past events');
    assert.equal(pageMode({ status: 'error', scope: [at(2)], today, upcomingCount: 1, plain: false }), 'list', 'stale data beats an error screen');
  });
  await test('For you lists from the chosen day on; the featured event is not repeated', () => {
    const a = at(1, { featured: true }, 'a'), b = at(2, {}, 'b'), c = at(-5, {}, 'c');
    const r = selectEvents([c, a, b], base);
    assert.deepEqual(r.upcoming.map((e) => e.id), ['a', 'b']); assert.equal(r.featured!.id, 'a'); assert.deepEqual(r.rest.map((e) => e.id), ['b']);
  });
  await test('Today and This week', () => {
    const t = at(0, {}, 't'), w = at(0, {}, 'w'), far = at(30, {}, 'far');
    assert.deepEqual(selectEvents([t, far], { ...base, filter: 'Today' }).upcoming.map((e) => e.id), ['t']);
    assert.ok(selectEvents([t, w, far], { ...base, filter: 'This week' }).upcoming.every((e) => e.id !== 'far'));
  });
  await test('Free only counts events listed as free; an unlisted fee is not free', () => {
    const free = at(1, { fee: 0 }, 'free'), paid = at(1, { fee: 50 }, 'paid'), unknown = at(1, { fee: null }, 'unknown');
    assert.deepEqual(selectEvents([free, paid, unknown], { ...base, filter: 'Free' }).upcoming.map((e) => e.id), ['free']);
  });
  await test('categories come from the loaded data; picking one narrows the list', () => {
    const a = at(1, { kind: 'SOCIAL' }, 'a'), b = at(2, { kind: 'TECHNOLOGY' }, 'b'), c = at(3, { kind: 'SOCIAL' }, 'c');
    assert.deepEqual(categoriesOf([a, b, c]), ['SOCIAL', 'TECHNOLOGY']); assert.deepEqual(categoriesOf([]), []);
    assert.deepEqual(selectEvents([a, b, c], { ...base, category: 'SOCIAL' }).upcoming.map((e) => e.id), ['a', 'c']);
    assert.equal(selectEvents([a], { ...base, category: 'TECHNOLOGY' }).upcoming.length, 0);
  });
  await test('picking a later day hides earlier events; events on that day lead', () => {
    const a = at(1, {}, 'a'), b = at(4, { featured: true }, 'b'), c = at(6, {}, 'c');
    const sel = startOfDay(new Date(b.startsAt!));
    const r = selectEvents([a, b, c], { ...base, sel });
    assert.deepEqual(r.upcoming.map((e) => e.id), ['b', 'c']); assert.equal(r.featured!.id, 'b');
  });
  await test('empty input never throws', () => {
    const r = selectEvents([], base); assert.equal(r.featured, undefined); assert.deepEqual(r.rest, []);
  });

  console.log(`\n${passed} tests passed`);
})().catch((e) => { console.error(e); process.exit(1); });
