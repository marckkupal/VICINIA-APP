// Renders the real ExploreMap screen with react-native-web + jsdom (maps stubbed). See tests/README.md.
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { pretendToBeVisual: true, url: 'http://localhost/' });
const g: any = globalThis;
g.window = dom.window; g.document = dom.window.document; g.navigator = dom.window.navigator;
for (const k of ['ShadowRoot', 'CSSStyleSheet', 'DocumentFragment', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLDivElement', 'FocusEvent', 'UIEvent', 'PointerEvent', 'CustomEvent', 'HTMLElement', 'Node', 'Element', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'MutationObserver', 'Event', 'KeyboardEvent', 'MouseEvent']) g[k] = (dom.window as any)[k];
g.IS_REACT_ACT_ENVIRONMENT = true;
g.React = require('react'); // tsx compiles JSX the classic way; Metro uses the automatic runtime
const setSize = (w: number, h: number) => { (dom.window as any).innerWidth = w; (dom.window as any).innerHeight = h; require('react').act(() => { dom.window.dispatchEvent(new dom.window.Event('resize')); }); };

const { createElement: h } = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react');
const { ExploreMap } = require('../src/screens/ExploreMap');
const { CAMPUSES, partitionPins } = require('../src/geo');
const { PLACES } = require('../src/data');
const { mapHeight } = require('../src/exploreLayout');

let fails = 0;
const ok = (n: string, c: boolean) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', n); };

const root = createRoot(document.getElementById('root')!);
const text = () => document.body.textContent ?? '';
const byLabel = (l: string) => Array.from(document.querySelectorAll(`[aria-label="${l}"]`)) as HTMLElement[];
const byLabelStarts = (l: string) => Array.from(document.querySelectorAll('[aria-label]')).filter((e) => (e.getAttribute('aria-label') ?? '').startsWith(l)) as HTMLElement[];
const click = async (el: HTMLElement | undefined) => { if (!el) throw new Error('element not found'); await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }); };
const markers = () => byLabelStarts('marker: ').filter((m) => !m.getAttribute('aria-label')!.includes('TIP Quezon City')); // the campus-centre marker is not a place

function Harness(props: any) {
  const { useState } = require('react');
  const [q, setQ] = useState(''); const [f, setF] = useState('all'); const [sel, setSel] = useState<string | null>(null);
  props.api.setQ = setQ; props.api.sel = sel;
  const opened: any[] = props.opened;
  return h(ExploreMap, { places: props.places, query: q, onQuery: setQ, filter: f, onFilter: setF, selectedId: sel, onSelect: setSel, saved: {}, onToggleSave: () => {}, posts: props.posts, onBack: () => {}, onOpen: (p: any) => opened.push(p.id), onDirections: () => {} });
}
let seq = 0;
const mount = async (places: any[], posts: any[] = []) => {
  const api: any = {}; const opened: any[] = [];
  await act(async () => { root.render(h(Harness, { key: ++seq, places, posts, api, opened })); });
  return { api, opened };
};

(async () => {
  console.log('--- A. shipped data: campus unverified -> list-only fallback ---');
  setSize(390, 844);
  await mount(PLACES);
  ok('no markers drawn', markers().length === 0);
  ok('no map/list toggle', byLabel('Show map').length === 0);
  ok('explains the map is unavailable', text().includes('The map isn’t available yet'));
  ok('all 4 sample places still listed', PLACES.every((p: any) => text().includes(p.name)));
  ok('"Shops" category is gone', !text().includes('Shops'));

  console.log('--- B. verified fixture campus ---');
  const c = CAMPUSES[0];
  Object.assign(c, { verified: true, center: { lat: 10, lng: 120 }, bounds: { south: 9.99, west: 119.99, north: 10.01, east: 120.01 }, source: 'TEST FIXTURE' });
  const fx = [
    { ...PLACES[0], id: 'in1', name: 'Fixture Cafe', coord: { lat: 10.001, lng: 120.001 } },
    { ...PLACES[1], id: 'in2', name: 'Fixture Study Hall', building: 'Test Bldg 2F', coord: { lat: 9.999, lng: 120.002 } },
    { ...PLACES[2], id: 'far', name: 'Far Away Hub', coord: { lat: 14.595, lng: 120.988 } },
    { ...PLACES[0], id: 'bad', name: 'Bad Coord Cafe', coord: { lat: NaN, lng: 120 } },
    { ...PLACES[0], id: 'none', name: 'No Coord Cafe', coord: undefined },
  ];
  const posts = [{ id: 'p1', title: 'Best iced latte', body: 'Quiet corner by the window, outlets everywhere.', location: { name: 'Fixture Cafe', placeId: 'in1' } }];
  const { opened } = await mount(fx, posts);
  ok('only the 2 in-campus places get markers', markers().length === 2);
  ok('far / NaN / missing coords are not pinned', !markers().some((m) => /Far Away|Bad Coord|No Coord/.test(m.getAttribute('aria-label')!)));
  ok('hint says 3 places have no pin', text().includes('3 places have no pin'));
  ok('toggle is shown with 44pt targets', byLabel('Show map').length === 1 && byLabel('Show list').length === 1);
  ok('legend shows all categories', ['Study', 'Food', 'Orgs'].every((l) => text().includes(l)));
  ok('map view hides the list rows', !text().includes('Far Away Hub'));
  ok('placeholder prompt before selection', text().includes('Tap a marker'));

  console.log('--- C. marker selection ---');
  await click(markers().find((m) => m.getAttribute('aria-label')!.includes('Fixture Cafe')));
  ok('popup shows title', text().includes('Fixture Cafe') && text().includes('FOOD · CAFE'));
  ok('popup shows distance from campus', /\d+ m from campus/.test(text()));
  ok('popup shows post snippet', text().includes('Best iced latte') && text().includes('Quiet corner by the window'));
  ok('popup has View details CTA', byLabel('Close place info').length === 1 && text().includes('View details'));
  await click(markers().find((m) => m.getAttribute('aria-label')!.includes('Fixture Cafe')));
  ok('tapping the same marker again deselects', text().includes('Tap a marker'));
  await click(markers().find((m) => m.getAttribute('aria-label')!.includes('Fixture Study Hall')));
  ok('second marker shows building and no-post fallback', text().includes('Test Bldg 2F') && text().includes('No posts about this place yet.'));
  ok('study popup uses its own category label', text().includes('STUDY · STUDY SPACE'));
  await click(byLabel('Close place info')[0]);
  ok('close button clears the popup', text().includes('Tap a marker'));
  await click(markers()[0]);
  const vd = Array.from(document.querySelectorAll('div')).find((d) => d.textContent === 'View details' && d.children.length === 0)!;
  await click(vd.parentElement as HTMLElement);
  ok('View details opens that place', opened.length === 1 && ['in1', 'in2'].includes(opened[0]));

  console.log('--- D. search/filter drops a selection that is no longer on the map ---');
  const state = await mount(fx, posts);
  await click(markers().find((m) => m.getAttribute('aria-label')!.includes('Fixture Cafe')));
  ok('cafe selected', text().includes('FOOD · CAFE') && state.api.sel === 'in1');
  await act(async () => { state.api.setQ('hall'); });
  ok('search leaves only the study hall pinned', markers().length === 1);
  ok('stale selection cleared, no popup for a hidden place', state.api.sel === null && text().includes('Tap a marker') && !text().includes('FOOD · CAFE'));
  await act(async () => { state.api.setQ('zzzz'); });
  ok('no matches: empty-state message, no markers', markers().length === 0 && text().includes('No places found'));
  await act(async () => { state.api.setQ(''); });

  console.log('--- E. list view on mobile ---');
  await click(byLabel('Show list')[0]);
  ok('list shows every place incl. unpinned ones', ['Fixture Cafe', 'Far Away Hub', 'Bad Coord Cafe', 'No Coord Cafe'].every((n) => text().includes(n)));
  ok('no markers in list view', markers().length === 0);
  ok('"show on map" only for the 2 pinned places', byLabelStarts('Show ').filter((e) => /on the map$/.test(e.getAttribute('aria-label')!)).length === 2);
  await click(byLabelStarts('Show Fixture Study Hall on the map')[0]);
  ok('"show on map" switches to the map and opens the popup', markers().length === 2 && text().includes('Test Bldg 2F'));

  console.log('--- F. verified campus but nothing pinnable -> list still shown ---');
  await mount([fx[2], fx[3], fx[4]]);
  ok('no markers, list visible so the screen is never empty', markers().length === 0 && text().includes('Far Away Hub') && text().includes('No Coord Cafe'));

  console.log('--- G. responsive sizing ---');
  ok('phone map height is within 240..520 and below tablet', mapHeight(844, 390) >= 240 && mapHeight(844, 390) <= 520 && mapHeight(844, 390) < mapHeight(1024, 820));
  setSize(1024, 768); await mount(fx, posts);
  ok('tablet width still renders toggle + markers', byLabel('Show map').length === 1 && markers().length === 2);
  setSize(320, 568); await mount(fx, posts);
  ok('small phone (320x568) renders toggle + markers', byLabel('Show map').length === 1 && markers().length === 2);
  ok('small phone map height respects the 240 floor', mapHeight(568, 320) === 240);

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });
