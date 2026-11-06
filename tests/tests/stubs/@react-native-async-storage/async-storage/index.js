// File-backed AsyncStorage stand-in so a second process behaves like an app restart. VERIFY_FAIL_WRITES=1 makes writes fail.
const fs = require('fs');
const F = process.env.VERIFY_STORE || '/tmp/verify-store.json';
const read = () => { try { return JSON.parse(fs.readFileSync(F, 'utf8')); } catch { return {}; } };
const store = {
  getItem: async (k) => read()[k] ?? null,
  setItem: async (k, v) => { if (process.env.VERIFY_FAIL_WRITES) throw new Error('disk full'); const d = read(); d[k] = v; fs.writeFileSync(F, JSON.stringify(d)); },
};
module.exports = store; module.exports.default = store; module.exports.__esModule = true;
