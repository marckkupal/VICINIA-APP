// End-to-end checks for profile + settings, run as separate processes (see tests/e2e.sh) so that a new process is a real app restart:
//   - the backend is tests/fakeFirebase.ts (state kept in a file, so it outlives the "app")
//   - "device A" / "device B" are two AsyncStorage files (VERIFY_STORE)
// Usage: npx tsx tests/e2e.profile.ts <phase>
import './stubs/images';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fb, installFakeFirebase } from './fakeFirebase';
import { fetchAccountProfile, logIn } from '../src/auth';
import { submitProfile } from '../src/profileSave';
import { hydrateSettings, peekSettings, toggleNotifPref, togglePrivacyPref } from '../src/settings';
import type { User } from '../src/types';

installFakeFirebase();
const EMAIL = 'marck@tip.edu.ph', PW = 'Pass1234', UID = 'uid-marck';
const ANA = 'ana@tip.edu.ph', ANA_UID = 'uid-ana';
const DEVICE = process.env.VERIFY_STORE as string;
const sleep = (ms = 60) => new Promise((r) => setTimeout(r, ms)); // lets the fire-and-forget device save finish
const deviceFile = () => (fs.existsSync(DEVICE) ? fs.readFileSync(DEVICE, 'utf8') : '{}');
const deviceKeys = () => Object.keys(JSON.parse(deviceFile()));
const remoteSettings = (uid: string) => {
  const m = fb.doc(uid)?.fields?.settings?.mapValue?.fields;
  const flat = (g: any) => Object.fromEntries(Object.entries(g?.mapValue?.fields ?? {}).map(([k, v]: any) => [k, v.booleanValue]));
  return m ? { notif: flat(m.notif), privacy: flat(m.privacy) } : null;
};
const str = (uid: string, k: string) => fb.doc(uid)?.fields?.[k]?.stringValue;
const signIn = async (email = EMAIL): Promise<User> => {
  const r = await logIn(email, PW);
  assert.equal(r.status, 'ok');
  return (r as any).user;
};
let n = 0;
const ok = (m: string) => console.log(`ok ${++n} - ${m}`);
const base0 = (u: User): User => ({ ...u });

const phases: Record<string, () => Promise<void>> = {
  async seed() {
    fb.reset();
    fb.seed(EMAIL, PW, UID, { name: 'Marck Dequito', email: EMAIL, university: 'Technological Institute of the Philippines Q.C.', program: 'BSIT', year: '3rd year', createdAt: '2026-10-01' });
    fb.seed(ANA, PW, ANA_UID, { name: 'Ana Reyes', email: ANA, university: 'Technological Institute of the Philippines Q.C.', program: 'BSCS', year: '2nd year', createdAt: '2026-10-02' });
    ok('backend seeded with two accounts');
  },

  // App launch #1 on device A: edit profile, change settings.
  async session1() {
    const user = await signIn();
    assert.equal(user.name, 'Marck Dequito');
    const base = { ...user, ...(await fetchAccountProfile()) };

    let savedCb = 0;
    const out = await submitProfile({ ...base, name: '  Marck D. Dequito ', program: 'BSCS', year: '4th year' }, base, () => { savedCb++; });
    assert.equal(out.ok, true);
    assert.equal(savedCb, 1);
    // Persistence verified on the BACKEND itself, not through the app:
    assert.equal(str(UID, 'name'), 'Marck D. Dequito');
    assert.equal(str(UID, 'program'), 'BSCS');
    assert.equal(str(UID, 'year'), '4th year');
    assert.equal(str(UID, 'email'), EMAIL);          // login identity untouched
    assert.equal(str(UID, 'createdAt'), '2026-10-01'); // fields outside the mask untouched
    assert.equal(fb.state().accounts[EMAIL].displayName, 'Marck D. Dequito'); // auth display name kept in step
    ok('successful save: onSaved fired once, and the backend document itself holds the new values');

    await hydrateSettings(EMAIL);
    assert.equal(await toggleNotifPref(EMAIL, 'recs'), true);
    assert.equal(await togglePrivacyPref(EMAIL, 'campus'), 'account');
    assert.equal(await togglePrivacyPref(EMAIL, 'location'), 'device');
    assert.deepEqual(remoteSettings(UID), { notif: { replies: true, events: true, recs: true }, privacy: { campus: false, suggest: true } });
    ok('account-level toggles are stored on the backend; location is not sent there');

    await sleep();
    const text = deviceFile();
    assert.deepEqual(deviceKeys(), ['vicinia_settings']);
    assert.equal(JSON.parse(JSON.parse(text).vicinia_settings)[EMAIL].privacy.location, true);
    for (const secret of ['Marck', 'Pass1234', 'idt:', 'rt:uid', 'BSCS', '4th year']) assert.ok(!text.includes(secret), `device storage must not contain "${secret}"`);
    ok('device storage holds only the settings copy (incl. location); no profile fields, password or tokens');
  },

  // App restart on device A, backend online: reload from the account.
  async session2() {
    await sleep();
    assert.deepEqual(peekSettings(EMAIL), { notif: { replies: true, events: true, recs: true }, privacy: { campus: false, suggest: true, location: true } });
    ok('after restart the settings screen has something to show immediately (device copy)');

    const user = await signIn();
    assert.equal(user.name, 'Marck D. Dequito');
    assert.equal(user.program, 'BSCS');
    const p = await fetchAccountProfile();
    assert.deepEqual([p.name, p.program, p.year], ['Marck D. Dequito', 'BSCS', '4th year']);
    ok('cross-session reload: the saved profile comes back from the account');

    // Another device changes a setting on the account; this device must pick it up (the account wins over the device copy).
    const d = fb.state(); d.docs[UID].fields.settings.mapValue.fields.notif.mapValue.fields.events.booleanValue = false;
    fs.writeFileSync(process.env.FAKE_BACKEND!, JSON.stringify(d));
    await hydrateSettings(EMAIL);
    assert.equal(peekSettings(EMAIL).notif.events, false);
    assert.equal(peekSettings(EMAIL).privacy.location, true); // device-level value untouched by hydration
    ok('a change made on another device is picked up on reload; location stays as this device had it');
  },

  // Restart on device A, but the network drops after login.
  async offline() {
    await sleep();
    const user = await signIn();
    const base = { ...user, ...(await fetchAccountProfile()) };
    const before = JSON.stringify(fb.doc(UID));
    fb.failNext('network', 'any', 99);

    await assert.rejects(() => hydrateSettings(EMAIL), { code: 'auth/network-request-failed' });
    assert.equal(peekSettings(EMAIL).notif.recs, true); // last known values are still shown
    await assert.rejects(() => toggleNotifPref(EMAIL, 'replies'), { code: 'auth/network-request-failed' });
    assert.equal(peekSettings(EMAIL).notif.replies, true); // not changed: it was never saved
    ok('offline: load and save both fail, nothing changes on screen, last known values stay');

    assert.equal(await togglePrivacyPref(EMAIL, 'location'), 'device'); // device-level works without a network
    await sleep();
    assert.equal(JSON.parse(JSON.parse(deviceFile()).vicinia_settings)[EMAIL].privacy.location, false);
    ok('offline: location (device-level) still saves, on the device');

    let cb = 0;
    const out = await submitProfile({ ...base, year: '3rd year' }, base, () => { cb++; });
    assert.deepEqual([out.ok, (out as any).kind, cb], [false, 'failed', 0]);
    assert.match((out as any).message, /No internet connection/);
    assert.equal(JSON.stringify(fb.doc(UID)), before);
    ok('offline: profile save reports the failure, onSaved is never called, backend unchanged');
  },

  // A different phone: nothing but the account carries over.
  async deviceB() {
    await sleep();
    assert.deepEqual(peekSettings(EMAIL), { notif: { replies: true, events: true, recs: false }, privacy: { campus: true, suggest: true, location: false } });
    ok('a fresh device starts from defaults before loading');
    const user = await signIn();
    assert.equal(user.name, 'Marck D. Dequito');
    await hydrateSettings(EMAIL);
    const s = peekSettings(EMAIL);
    assert.deepEqual([s.notif.recs, s.notif.events, s.privacy.campus], [true, false, false]); // account-level: follows the person
    assert.equal(s.privacy.location, false);                                                   // device-level: did NOT follow
    ok('on a second device the account-level settings and profile appear; the other device\'s location choice does not');
    await sleep();
    const text = deviceFile();
    assert.ok(!text.includes('Marck') && !text.includes('BSCS'));
    ok('second device stores no profile fields either');
  },

  // Another account on device A: no leakage from the first one.
  async otherAccount() {
    await sleep();
    assert.deepEqual(peekSettings(ANA), { notif: { replies: true, events: true, recs: false }, privacy: { campus: true, suggest: true, location: false } });
    await signIn(ANA);
    assert.equal((await fetchAccountProfile()).name, 'Ana Reyes');
    await hydrateSettings(ANA);
    assert.equal(peekSettings(ANA).notif.recs, false);
    const marckBefore = JSON.stringify(fb.doc(UID));
    assert.equal(await toggleNotifPref(ANA, 'replies'), true);
    assert.equal(remoteSettings(ANA_UID)!.notif.replies, false);
    assert.equal(JSON.stringify(fb.doc(UID)), marckBefore);
    assert.ok(fb.writesTo(UID).length === 0 && fb.writesTo(ANA_UID).length >= 1);
    ok('a second account on the same device starts clean and only ever writes its own document');
  },

  // Failure handling, all in one process against one signed-in user.
  async errors() {
    const user = await signIn();
    const base = { ...user, ...(await fetchAccountProfile()) };
    const snap = () => JSON.stringify(fb.doc(UID));
    const edit = (o: Partial<User>) => ({ ...base, ...o });
    let cb = 0; const cbf = () => { cb++; };
    const failed = async (o: Partial<User>, kind: string, re?: RegExp) => {
      const before = snap(); cb = 0;
      const out: any = await submitProfile(edit(o), base, cbf);
      assert.equal(out.ok, false); assert.equal(out.kind, kind); assert.equal(cb, 0, 'onSaved must not run');
      if (re) assert.match(out.message, re);
      assert.equal(snap(), before, 'backend must be unchanged');
    };

    // bad inputs: rejected on the device, no request leaves the app
    const sent = fb.requests.length;
    for (const o of [{ name: '' }, { name: 'Ana 123' }, { name: 'A' }, { name: 'x'.repeat(61) }, { university: '  ' }, { program: '' }, { program: 'BS Cooking' }, { year: '' }, { year: '9th year' }]) {
      await failed(o, 'invalid');
    }
    assert.equal(fb.requests.length, sent);
    ok('bad inputs are rejected with field errors; no request is sent and nothing is saved');

    const out: any = await submitProfile(edit({}), base, cbf);
    assert.deepEqual([out.ok, out.kind], [false, 'unchanged']);
    ok('saving with no changes sends nothing and shows no success');

    fb.failNext('network'); await failed({ year: '1st year' }, 'failed', /No internet connection/);
    ok('network failure: error shown, no success, backend unchanged');
    fb.failNext('http500'); await failed({ year: '1st year' }, 'failed', /Could not reach Firebase/);
    ok('HTTP 500: error shown, no success, backend unchanged');
    fb.failNext('http403'); await failed({ year: '1st year' }, 'failed', /blocked saving/);
    ok('HTTP 403 (rules deny the write): error shown, no success, backend unchanged');
    fb.failNext('http401'); await failed({ year: '1st year' }, 'failed', /session has expired/);
    ok('HTTP 401: told to log in again, no success, backend unchanged');
    fb.failNext('dropWrite'); await failed({ year: '1st year' }, 'failed', /could not be confirmed/);
    ok('HTTP 200 but the server did not store the write: NOT reported as saved');

    // same rules for settings
    for (const [kind, re] of [['network', 'auth/network-request-failed'], ['http500', 'unavailable'], ['http403', 'permission-denied'], ['http401', 'auth/session-expired'], ['dropWrite', 'firestore/not-persisted']] as const) {
      const before = JSON.stringify(peekSettings(EMAIL)); const dbBefore = snap();
      fb.failNext(kind);
      await assert.rejects(() => toggleNotifPref(EMAIL, 'recs'), { code: re });
      assert.equal(JSON.stringify(peekSettings(EMAIL)), before);
      assert.equal(snap(), dbBefore);
    }
    ok('settings: every failure kind rejects, the switch value never changes, backend unchanged');

    // no optimistic state: while the request is in flight the shown value is still the old one
    const release = fb.hold();
    const was = peekSettings(EMAIL).notif.recs;
    const p = toggleNotifPref(EMAIL, 'recs');
    await sleep(40);
    assert.equal(peekSettings(EMAIL).notif.recs, was, 'must not show the new value before the server confirmed');
    assert.equal(await toggleNotifPref(EMAIL, 'replies'), false); // a second tap during the save is ignored
    release();
    assert.equal(await p, true);
    assert.equal(peekSettings(EMAIL).notif.recs, !was);
    ok('no optimistic success: the value changes only after the server confirmed; a tap during a save is ignored');

    // unauthorized
    const ownWrites = fb.requests.filter((r) => r.method === 'PATCH' && r.status === 200);
    assert.ok(ownWrites.every((r) => r.url.includes(`/users/${UID}`)));
    const f = (globalThis as any).fetch;
    const docUrl = fb.requests.find((r) => r.url.includes('/documents/'))!.url.replace(UID, ANA_UID).split('?')[0];
    const token = fb.requests.filter((r) => r.auth).pop()!.auth;
    assert.equal((await f(docUrl, { headers: { Authorization: token } })).status, 403);
    assert.equal((await f(docUrl, { method: 'PATCH', headers: { Authorization: token }, body: JSON.stringify({ fields: { name: { stringValue: 'hacked' } } }) })).status, 403);
    assert.equal((await f(docUrl.replace(ANA_UID, UID), {})).status, 401);
    assert.equal(str(ANA_UID, 'name'), 'Ana Reyes');
    ok('unauthorized: backend refuses another user\'s document and unauthenticated calls; the app only ever writes its own');

    fb.revokeSession(UID);
    const writesBefore = fb.requests.length;
    cb = 0;
    const o2: any = await submitProfile(edit({ year: '2nd year' }), base, cbf);
    assert.deepEqual([o2.ok, o2.kind, cb], [false, 'failed', 0]);
    assert.match(o2.message, /session has expired/);
    assert.ok(!fb.requests.slice(writesBefore).some((r) => r.method === 'PATCH' && r.url.includes('/documents/')), 'no write attempted with a dead session');
    await assert.rejects(() => toggleNotifPref(EMAIL, 'recs'), { code: 'auth/session-expired' });
    ok('revoked session: profile and settings saves are refused with "log in again" and nothing is written');
  },
};

const phase = process.argv[2];
if (!phases[phase]) { console.error('unknown phase', phase); process.exit(2); }
phases[phase]().then(() => console.log(`phase ${phase} passed (${n} checks)`)).catch((e) => { console.error(`phase ${phase} FAILED`); console.error(e); process.exit(1); });
