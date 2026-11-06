// Run: npx tsx tests/geo.test.ts   (pure logic, no React Native needed)
// The campus below is a TEST FIXTURE only (a made-up box), never shipped data. It exists to prove the geofence rules.
import { CAMPUSES, distanceKm, fmtKm, isValidCoord, mapCampuses, partitionPins, resolvePin, startRegion } from '../src/geo';
import type { Campus } from '../src/geo';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PLACES } from '../src/data';
import { placeInScope, submitPost, validateDraft, pagePosts, explorePostsKey } from '../src/postTargets';
import { COMPACT_MAX_WIDTH, MARKER_HIT, MIN_TOUCH, isCompact, mapHeight, nextSelection, reconcileSelection, reduceView } from '../src/exploreLayout';
import { markerStyle, snippet } from '../src/exploreMarkers';

let fails = 0;
const ok = (n: string, c: boolean) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', n); };

const A: Campus = { id: 'a', name: 'Test A', address: '', verified: true, center: { lat: 10, lng: 120 }, bounds: { south: 9.99, west: 119.99, north: 10.01, east: 120.01 }, maxKm: 1 };
const B: Campus = { id: 'b', name: 'Test B', address: '', verified: true, center: { lat: 11, lng: 121 }, bounds: { south: 10.99, west: 120.99, north: 11.01, east: 121.01 }, maxKm: 1 };
const U: Campus = { id: 'u', name: 'Unverified', address: '', verified: false, center: { lat: 12, lng: 122 }, bounds: { south: 11.99, west: 121.99, north: 12.01, east: 122.01 }, maxKm: 1 };
const cs = [A, B, U];
const at = (lat: unknown, lng: unknown, campusId = 'a') => ({ coord: { lat, lng }, campusId });

console.log('--- validation ---');
ok('valid coord', isValidCoord({ lat: 10, lng: 120 }));
ok('NaN rejected', !isValidCoord({ lat: NaN, lng: 120 }));
ok('string rejected', !isValidCoord({ lat: '10', lng: 120 }));
ok('out of range rejected', !isValidCoord({ lat: 120, lng: 10 }));
ok('(0,0) placeholder rejected', !isValidCoord({ lat: 0, lng: 0 }));

console.log('--- geofence ---');
ok('inside A pinned', resolvePin(at(10.001, 120.001), cs).ok);
ok('outside A (far, e.g. another city) not pinned', !resolvePin(at(14.595, 120.988), cs).ok);
ok('inside bbox but beyond maxKm not pinned', !resolvePin(at(10.0099, 120.0099), [{ ...A, maxKm: 0.2 }]).ok);
const sw = resolvePin(at(120.001, 10.001), cs);
ok('swapped lat/lng not pinned', !sw.ok);
ok('invalid coord reason', (resolvePin(at(NaN, 1), cs) as any).reason === 'invalid-coord');
ok('missing coord reason', (resolvePin({ campusId: 'a' }, cs) as any).reason === 'no-coord');
ok('unverified campus -> no pins', (resolvePin(at(12, 122, 'u'), cs) as any).reason === 'campus-unverified');
ok('unknown campus -> no pin', (resolvePin(at(10, 120, 'zzz'), cs) as any).reason === 'unknown-campus');

console.log('--- multi-campus is preserved ---');
ok('campus B place pins against B', resolvePin(at(11.001, 121.001, 'b'), cs).ok);
ok('campus B coordinates under campus A are rejected', !resolvePin(at(11.001, 121.001, 'a'), cs).ok);
const parts = partitionPins([at(10, 120), at(11, 121, 'b'), at(50, 50), { campusId: 'a' } as any], cs);
ok('partition: 2 pins, 2 list-only', parts.pins.length === 2 && parts.unpinned.length === 2);

console.log('--- shipped data ---');
ok('shipped campus is not marked verified without data', CAMPUSES.every((c) => !c.verified || (c.center && c.bounds)));
ok('no shipped place has an unchecked coordinate pinned', partitionPins(PLACES).pins.every((p) => p.campus.verified));
ok('unverified shipped campus -> no map campuses', mapCampuses().length === CAMPUSES.filter((c) => c.verified).length);
ok('unverified campus has no start region', startRegion(U) === undefined);
ok('verified campus start region centres on bounds', Math.abs(startRegion(A)!.latitude - 10) < 1e-9);
ok('all sample places still listed', PLACES.length === 4);
ok('in-scope place kept, 1.2 km place rejected', placeInScope(PLACES[0]) && !placeInScope(PLACES[3]));
ok('verified campus: out-of-campus coord rejected by composer scope', !placeInScope({ ...PLACES[0], campusId: 'a', coord: { lat: 14.595, lng: 120.988 } }, cs));
ok('verified campus: in-campus coord accepted by composer scope', placeInScope({ ...PLACES[0], campusId: 'a', coord: { lat: 10.001, lng: 120.001 } }, cs));
ok('unverified campus: composer falls back to listed distance (tagging keeps working)', placeInScope({ ...PLACES[0], campusId: 'u', coord: { lat: 1, lng: 1 } }, cs));
ok('unverified campus: distance still enforced', !placeInScope({ ...PLACES[3], campusId: 'u', coord: { lat: 12, lng: 122 } }, cs));

console.log('--- markers / popup helpers ---');
ok('each kind has a distinct colour and shape', new Set((['study', 'food', 'orgs'] as const).map((k) => markerStyle(k).color)).size === 3 && new Set((['study', 'food', 'orgs'] as const).map((k) => markerStyle(k).shape)).size === 3);
ok('snippet clips long text', snippet('x'.repeat(200)).length <= 90);
ok('snippet handles undefined', snippet(undefined) === '');
ok('fmtKm', fmtKm(0.3) === '300 m' && fmtKm(1.24) === '1.2 km');
ok('distance sanity (~111 km per degree)', Math.abs(distanceKm({ lat: 0.5, lng: 10 }, { lat: 1.5, lng: 10 }) - 111.2) < 0.5);



console.log('--- coordinate maths ---');
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
ok('same point is 0 km', distanceKm({ lat: 10, lng: 120 }, { lat: 10, lng: 120 }) === 0);
ok('symmetric', distanceKm({ lat: 10, lng: 120 }, { lat: 10.5, lng: 120.5 }) === distanceKm({ lat: 10.5, lng: 120.5 }, { lat: 10, lng: 120 }));
ok('1 deg longitude at the equator ~111.2 km', near(distanceKm({ lat: 0, lng: 100 }, { lat: 0, lng: 101 }), 111.19, 0.1));
ok('1 deg longitude at 60N ~55.6 km (cos scaling)', near(distanceKm({ lat: 60, lng: 10 }, { lat: 60, lng: 11 }), 55.6, 0.2));
ok('0.009 deg latitude ~1 km (the Explore radius)', near(distanceKm({ lat: 14.6, lng: 121 }, { lat: 14.609, lng: 121 }), 1.0, 0.01));
ok('Cubao to Quiapo (Manila) is several km, far outside any campus radius', distanceKm({ lat: 14.6179, lng: 121.0558 }, { lat: 14.59528, lng: 120.98806 }) > 7);
ok('fmtKm: metres under 0.95 km, one decimal above', fmtKm(0.04) === '50 m' && fmtKm(0.949) === '900 m' && fmtKm(0.96) === '1.0 km' && fmtKm(2.34) === '2.3 km');

console.log('--- bounding box edges ---');
ok('point exactly on the SW corner is inside', resolvePin(at(9.99, 119.99), [{ ...A, maxKm: 5 }]).ok);
ok('point exactly on the NE corner is inside', resolvePin(at(10.01, 120.01), [{ ...A, maxKm: 5 }]).ok);
ok('point just beyond the north edge is outside', !resolvePin(at(10.010001, 120), [{ ...A, maxKm: 5 }]).ok);
ok('point just beyond the west edge is outside', !resolvePin(at(10, 119.989999), [{ ...A, maxKm: 5 }]).ok);
ok('inverted bounds make the campus unusable (no pins)', !resolvePin(at(10, 120), [{ ...A, bounds: { south: 10.01, west: 120.01, north: 9.99, east: 119.99 } }]).ok);
ok('centre outside its own bounds makes the campus unusable', !resolvePin(at(10, 120), [{ ...A, center: { lat: 50, lng: 50 } }]).ok);
ok('verified flag without bounds is not trusted', !resolvePin(at(10, 120), [{ ...A, bounds: undefined }]).ok);
ok('Infinity rejected', !isValidCoord({ lat: Infinity, lng: 120 }) && !isValidCoord(null) && !isValidCoord(undefined) && !isValidCoord([]));

console.log('--- selection and view rules ---');
const ids = ['p1', 'p2'];
ok('select a pinned id', nextSelection(null, 'p1', ids) === 'p1');
ok('tap same id again clears', nextSelection('p1', 'p1', ids) === null);
ok('tap another id switches', nextSelection('p1', 'p2', ids) === 'p2');
ok('tap empty map clears', nextSelection('p1', null, ids) === null);
ok('unpinned id is ignored (keeps current)', nextSelection('p1', 'ghost', ids) === 'p1' && nextSelection(null, 'ghost', ids) === null);
ok('reconcile keeps a still-visible selection', reconcileSelection('p1', ids) === 'p1');
ok('reconcile clears a dropped selection', reconcileSelection('p9', ids) === null && reconcileSelection(null, ids) === null);
let vs = reduceView({ view: 'map', selectedId: null }, { type: 'setView', view: 'list' });
ok('toggle to list', vs.view === 'list');
vs = reduceView(vs, { type: 'showOnMap', id: 'p2', pinnedIds: ids });
ok('show-on-map from list selects and switches to map', vs.view === 'map' && vs.selectedId === 'p2');
const same = reduceView({ view: 'list', selectedId: null }, { type: 'showOnMap', id: 'ghost', pinnedIds: ids });
ok('show-on-map for an unpinned place does nothing', same.view === 'list' && same.selectedId === null);

console.log('--- responsive rules ---');
ok('touch targets are at least 44pt', MIN_TOUCH >= 44 && MARKER_HIT >= 44);
ok('phones are compact, tablets are not', isCompact(320) && isCompact(390) && isCompact(COMPACT_MAX_WIDTH - 1) && !isCompact(COMPACT_MAX_WIDTH) && !isCompact(820));
ok('map height stays within 240..520 for every size', [[568, 320], [667, 375], [844, 390], [932, 430], [1024, 768], [1366, 1024], [3000, 3000]].every(([h, w]) => mapHeight(h, w) >= 240 && mapHeight(h, w) <= 520));
ok('bad window sizes fall back to 340', mapHeight(0, 0) === 340 && mapHeight(NaN, 390) === 340 && mapHeight(800, -1) === 340);
ok('phone map leaves room for the popup (<= ~45% of height on a typical phone)', mapHeight(844, 390) <= 844 * 0.45);

(async () => {
  console.log('--- location tagging on post creation (regression) ---');
  const user: any = { name: 'Ana Cruz', email: 'ana@tip.edu.ph', university: '', program: '', year: '', password: '' };
  const base = { destination: 'explore' as const, tag: 'Food', mode: 'post' as const, title: 'Great coffee', body: '', link: '', media: [], alerts: true };
  const errs = (loc: any) => validateDraft({ ...base, location: loc } as any, { user, boards: [] });
  ok('known in-scope place accepted', !errs({ placeId: '1', name: '' }).location);
  ok('place beyond 1 km rejected', !!errs({ placeId: '4', name: '' }).location);
  ok('custom "other location" accepted', !errs({ name: 'Near the 20th Ave gate' }).location);
  ok('blank location rejected', !!errs({ name: '  ' }).location);
  ok('location is still required', !!errs(undefined).location);
  const r = await submitPost({ ...base, location: { placeId: '1', name: '' } } as any, { user, boards: [] });
  ok('submit succeeds for a known place', r.destination === 'explore');
  // Read it back the way the screens do: through the persisted-list hook.
  const Feed = () => h('pre', null, JSON.stringify(pagePosts.useItems(explorePostsKey(user.email)).map((p: any) => p.location)));
  const read = () => JSON.parse(renderToStaticMarkup(h(Feed)).replace(/<\/?pre>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;/g, "'"));
  await pagePosts.load();
  let locs: any[] = read();
  ok('saved post keeps the place name and id', locs.length === 1 && locs[0].name === PLACES[0].name && locs[0].placeId === '1');
  ok('no unverified coordinate is stored on the post', locs[0].lat === undefined && locs[0].lng === undefined);
  await submitPost({ ...base, title: 'Custom spot', location: { name: 'Near the gate' } } as any, { user, boards: [] });
  await pagePosts.load(); locs = read();
  ok('custom location saved as plain text with no coordinates', locs.length === 2 && locs.some((l) => l.name === 'Near the gate' && l.placeId === undefined && l.lat === undefined));

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
