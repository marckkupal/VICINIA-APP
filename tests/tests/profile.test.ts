// Profile + settings persistence: runs the real auth.ts, settings.ts and profileRules.ts against a fake Firebase (fetch is stubbed).
import './stubs/images';
import assert from 'node:assert/strict';
import { fetchAccountProfile, logIn, updateProfile, loadRemoteSettings } from '../src/auth';
import { avatarChange, normalizeProfile, profileChanged, validateProfile } from '../src/profileRules';
import { hydrateSettings, peekSettings, toggleNotifPref, togglePrivacyPref } from '../src/settings';
import type { User } from '../src/types';

type Calls = { method: string; url: string; auth?: string; body?: any }[];
const calls: Calls = [];
let failFirestoreWrites = false;
// What Firestore holds for users/uid1 (only the stringValue / booleanValue shapes the app uses).
const doc: any = { fields: {
  name: { stringValue: 'Marck Dequito' }, email: { stringValue: 'marck@tip.edu.ph' }, university: { stringValue: 'TIP Q.C.' },
  program: { stringValue: 'BSIT' }, year: { stringValue: '3rd year' }, createdAt: { timestampValue: '2026-10-01T00:00:00Z' },
} };
const json = (status: number, body: any) => ({ ok: status < 400, status, json: async () => body }) as any;

(globalThis as any).fetch = async (url: string, init: any = {}) => {
  const method = init.method ?? 'GET';
  const auth = init.headers?.Authorization;
  const body = init.body && typeof init.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : init.body;
  calls.push({ method, url, auth, body });
  if (url.includes('accounts:signInWithPassword')) return json(200, { idToken: 'id1', refreshToken: 'r1', localId: 'uid1', displayName: 'Marck Dequito' });
  if (url.includes('accounts:lookup')) return json(200, { users: [{ emailVerified: true }] });
  if (url.includes('accounts:update')) return json(200, {});
  if (url.includes('securetoken')) return json(200, { id_token: 'fresh-token', refresh_token: 'r2' });
  if (url.includes('/documents/users/uid1')) {
    if (method === 'GET') return json(200, doc);
    if (failFirestoreWrites) return json(503, { error: { status: 'UNAVAILABLE' } });
    const mask = [...new URL(url).searchParams.getAll('updateMask.fieldPaths')];
    assert.ok(mask.length > 0, 'every profile/settings write must carry an updateMask');
    mask.forEach((m) => { doc.fields[m] = body.fields[m]; }); // Firestore only writes the masked fields
    return json(200, doc);
  }
  throw new Error('unexpected request ' + url);
};

const writes = () => calls.filter((c) => c.method === 'PATCH' && c.url.includes('/documents/'));
const user: User = { name: 'Marck Dequito', email: 'marck@tip.edu.ph', password: '', university: 'TIP Q.C.', program: 'BSIT', year: '3rd year' };
const EMAIL = user.email;
let n = 0;
const ok = (name: string) => console.log(`ok ${++n} - ${name}`);

(async () => {
  // ---- not signed in: nothing is sent, the person is told why
  await assert.rejects(() => updateProfile({ name: 'A B', university: 'x', program: 'BSIT', year: '1st year' }), { code: 'auth/no-session' });
  await assert.rejects(() => fetchAccountProfile(), { code: 'auth/no-session' });
  assert.equal(calls.length, 0);
  ok('profile calls refuse to run without a session (no request made)');

  await logIn(EMAIL, 'pw');
  calls.length = 0;

  // ---- load
  const p = await fetchAccountProfile();
  assert.deepEqual(p, { name: 'Marck Dequito', university: 'TIP Q.C.', program: 'BSIT', year: '3rd year', avatarUri: undefined });
  assert.equal(calls.find((c) => c.url.includes('/documents/'))!.auth, 'Bearer fresh-token');
  ok('profile loads from the account using a fresh bearer token');

  // ---- save: masked write, other fields untouched, auth header kept
  calls.length = 0;
  await updateProfile({ name: 'Marck D. Dequito', university: 'TIP Q.C.', program: 'BSCS', year: '4th year' });
  const w = writes();
  assert.equal(w.length, 1);
  assert.equal(w[0].auth, 'Bearer fresh-token');
  assert.deepEqual(new URL(w[0].url).searchParams.getAll('updateMask.fieldPaths').sort(), ['name', 'program', 'university', 'year']);
  assert.equal(doc.fields.program.stringValue, 'BSCS');
  assert.equal(doc.fields.email.stringValue, 'marck@tip.edu.ph');            // email never written
  assert.equal(doc.fields.createdAt.timestampValue, '2026-10-01T00:00:00Z'); // other fields preserved
  assert.ok(calls.some((c) => c.url.includes('accounts:update') && c.body.displayName === 'Marck D. Dequito'));
  ok('saving writes only the profile fields (updateMask), keeps email/createdAt, syncs display name');

  // ---- avatar: undefined leaves it, data link sets it, '' removes it
  await updateProfile({ name: 'Marck D. Dequito', university: 'TIP Q.C.', program: 'BSCS', year: '4th year', avatar: 'data:image/jpeg;base64,AAAA' });
  assert.equal(doc.fields.avatar.stringValue, 'data:image/jpeg;base64,AAAA');
  await updateProfile({ name: 'Marck D. Dequito', university: 'TIP Q.C.', program: 'BSCS', year: '4th year' });
  assert.equal(doc.fields.avatar.stringValue, 'data:image/jpeg;base64,AAAA');
  assert.equal((await fetchAccountProfile()).avatarUri, 'data:image/jpeg;base64,AAAA');
  await updateProfile({ name: 'Marck D. Dequito', university: 'TIP Q.C.', program: 'BSCS', year: '4th year', avatar: '' });
  assert.equal((await fetchAccountProfile()).avatarUri, undefined);
  ok('photo: untouched stays, new one is saved and reloaded, removal clears it');

  // ---- failed save rejects with a readable code
  failFirestoreWrites = true;
  await assert.rejects(() => updateProfile({ name: 'Ab', university: 'x', program: 'BSIT', year: '1st year' }), { code: 'unavailable' });
  failFirestoreWrites = false;
  ok('a failed save rejects (the form stays open and shows the error)');

  // ---- validation
  const good = { name: 'Ana Reyes', university: 'TIP Q.C.', program: 'BSIT', year: '2nd year' };
  assert.deepEqual(validateProfile(good), {});
  assert.ok(validateProfile({ ...good, name: '   ' }).name);
  assert.ok(validateProfile({ ...good, name: 'Ana 123' }).name);
  assert.ok(validateProfile({ ...good, name: 'A' }).name);
  assert.ok(validateProfile({ ...good, university: ' ' }).university);
  assert.ok(validateProfile({ ...good, program: '' }).program);
  assert.ok(validateProfile({ ...good, program: 'BS Underwater Basket Weaving' }).program);
  assert.equal(validateProfile({ ...good, program: 'BS Computer Science' }).program, undefined); // older wording maps to BSCS
  assert.ok(validateProfile({ ...good, year: '' }).year);
  assert.ok(validateProfile({ ...good, year: '9th year' }).year);
  ok('empty and invalid name / university / program / year are rejected');

  // ---- dirty tracking
  assert.equal(profileChanged(user, { ...user, name: '  Marck Dequito  ' }), false);
  assert.equal(profileChanged(user, { ...user, year: '4th year' }), true);
  assert.equal(profileChanged(user, { ...user, avatarUri: 'data:x' }), true);
  assert.equal(profileChanged(user, { ...user, email: 'other@tip.edu.ph' }), false);
  assert.equal(normalizeProfile({ ...user, program: 'BS Computer Science' }).program, 'BSCS');
  assert.equal(avatarChange(undefined, undefined), undefined);
  assert.equal(avatarChange('data:a', 'data:a'), undefined);
  assert.equal(avatarChange('data:a', undefined), '');
  assert.equal(avatarChange(undefined, 'data:b'), 'data:b');
  assert.equal(avatarChange(undefined, 'https://lh3.googleusercontent.com/x'), undefined); // web addresses are never copied to the account
  ok('unsaved-change detection ignores whitespace and the read-only email; remote photos are never uploaded');

  // ---- settings: nothing saved yet -> keep defaults
  assert.equal(await loadRemoteSettings(), null);
  await hydrateSettings(EMAIL);

  // ---- toggling saves the account-level map, location does not
  calls.length = 0;
  await toggleNotifPref(EMAIL, 'recs'); // default false -> true
  let sw = writes();
  assert.equal(sw.length, 1);
  assert.deepEqual(new URL(sw[0].url).searchParams.getAll('updateMask.fieldPaths'), ['settings']);
  assert.equal(sw[0].auth, 'Bearer fresh-token');
  const sent = sw[0].body.fields.settings.mapValue.fields;
  assert.equal(sent.notif.mapValue.fields.recs.booleanValue, true);
  assert.deepEqual(Object.keys(sent.privacy.mapValue.fields).sort(), ['campus', 'suggest']); // no location
  ok('notification toggle is saved to the account with the bearer token');

  calls.length = 0;
  await togglePrivacyPref(EMAIL, 'location');
  assert.equal(calls.length, 0);
  ok('location sharing is device-only: no request is made');

  // ---- failure puts the switch back
  failFirestoreWrites = true;
  const before = { ...(peekSettings(EMAIL)).notif };
  await assert.rejects(() => toggleNotifPref(EMAIL, 'replies'), { code: 'unavailable' });
  failFirestoreWrites = false;
  assert.deepEqual(peekSettings(EMAIL).notif, before);
  ok('a failed save leaves the toggle on its previous value (it never moved)');

  // ---- only one save at a time
  calls.length = 0;
  await Promise.all([toggleNotifPref(EMAIL, 'events'), toggleNotifPref(EMAIL, 'replies')]);
  assert.equal(writes().length, 1);
  ok('a second toggle during a save is ignored (no overlapping writes)');

  // ---- hydrate: account values win over this device's copy
  doc.fields.settings = { mapValue: { fields: {
    notif: { mapValue: { fields: { replies: { booleanValue: false }, events: { booleanValue: true }, recs: { booleanValue: true } } } },
    privacy: { mapValue: { fields: { campus: { booleanValue: false }, suggest: { booleanValue: true }, location: { booleanValue: true } } } },
  } } };
  const loc = peekSettings(EMAIL).privacy.location;
  await hydrateSettings(EMAIL);
  const now = peekSettings(EMAIL);
  assert.equal(now.notif.replies, false);
  assert.equal(now.privacy.campus, false);
  assert.equal(now.privacy.location, loc); // never taken from the account
  ok('settings opened on another device show the account values; location stays local');

  // ---- hydrate failure surfaces (screen disables the toggles and offers Retry)
  (globalThis as any).fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(() => hydrateSettings(EMAIL), { code: 'auth/network-request-failed' });
  ok('a failed load rejects so the screen can say so');

  console.log(`\nall ${n} checks passed`);
})().catch((e) => { console.error(e); process.exit(1); });
