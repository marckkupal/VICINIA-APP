import './stubs/images';
import assert from 'node:assert/strict';
import { eventLayout, TOUCH_MIN } from '../src/eventLayout';

assert.equal(TOUCH_MIN, 44);
for (const [w, size] of [[320, 'small'], [359, 'small'], [360, 'phone'], [390, 'phone'], [699, 'phone'], [700, 'tablet'], [1024, 'tablet']] as const) {
  assert.equal(eventLayout(w).size, size, `width ${w}`);
}
assert.equal(eventLayout(390).maxWidth, undefined);   // phones use the full width
assert.equal(eventLayout(1024).maxWidth, 720);        // large screens get a centered column
for (const w of [0, NaN, -5]) assert.equal(eventLayout(w).size, 'phone', `bad width ${w}`);
// the date tile must always fit a 44pt tap target and never grow past the row
for (const w of [280, 320, 390, 768, 1200]) { const L = eventLayout(w); assert.ok(L.tile >= TOUCH_MIN && L.tile <= 80); assert.ok(L.featuredTitle >= 20); }
console.log('eventLayout: ok');
