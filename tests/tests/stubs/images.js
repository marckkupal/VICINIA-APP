// Node cannot require() image files the way Metro does. This makes every bundled image load as a harmless placeholder id.
// Import it FIRST in any test that loads src/content (directly or through src/data.ts).
let n = 0;
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.webp']) require.extensions[ext] = (m, f) => { m.exports = ++n; };
