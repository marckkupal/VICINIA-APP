// Test-only: every svg primitive renders as an empty element.
const React = require('react');
const make = () => (p) => React.createElement('span', null, p && p.children);
module.exports = new Proxy({ __esModule: true, default: make() }, { get: (t, k) => (k in t ? t[k] : make()) });
