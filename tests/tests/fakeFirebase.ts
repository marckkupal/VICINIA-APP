// A stateful stand-in for the Firebase REST APIs that auth.ts talks to (Identity Toolkit, securetoken, Firestore `users/{uid}`).
// It enforces what the real backend enforces for these calls: tokens, "own document only" rules, updateMask semantics,
// and it keeps its data in a file so a second process behaves like the same backend after the app restarted.
// It can also misbehave on purpose (network failure, 401/403/500, a write that is accepted but not stored, a revoked session).
import fs from 'node:fs';

const FILE = process.env.FAKE_BACKEND || '/tmp/fake-backend.json';
type Account = { uid: string; password: string; displayName: string };
type State = { accounts: Record<string, Account>; docs: Record<string, any>; revoked: string[] };
const load = (): State => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return { accounts: {}, docs: {}, revoked: [] }; } };
const store = (s: State) => fs.writeFileSync(FILE, JSON.stringify(s));

export type FaultKind = 'network' | 'http500' | 'http403' | 'http401' | 'dropWrite';
export const fb = {
  requests: [] as { method: string; url: string; auth?: string; status: number }[],
  fault: null as null | { kind: FaultKind; on: 'write' | 'read' | 'any'; times: number },
  gate: null as null | Promise<void>, // holds the next Firestore write until released (for in-flight checks)
  state: load,
  reset() { store({ accounts: {}, docs: {}, revoked: [] }); this.requests.length = 0; this.fault = null; this.gate = null; },
  seed(email: string, password: string, uid: string, profile: Record<string, string>) {
    const s = load();
    s.accounts[email] = { uid, password, displayName: profile.name };
    s.docs[uid] = { fields: Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, { stringValue: v }])) };
    store(s);
  },
  revokeSession(uid: string) { const s = load(); s.revoked.push(uid); store(s); },
  doc(uid: string) { return load().docs[uid]; },
  hold(): () => void { let release!: () => void; this.gate = new Promise<void>((r) => { release = r; }); return () => { this.gate = null; release(); }; },
  failNext(kind: FaultKind, on: 'write' | 'read' | 'any' = 'write', times = 1) { this.fault = { kind, on, times }; },
  writesTo(uid: string) { return this.requests.filter((r) => r.method === 'PATCH' && r.url.includes(`/documents/users/${uid}`)); },
};

const res = (status: number, body: any) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as any;
const err = (status: number, s: string) => res(status, { error: { code: status, status: s, message: s } });
const uidOfToken = (auth?: string) => (auth?.startsWith('Bearer idt:') ? auth.split(':')[1] : null);

export function installFakeFirebase() {
  let n = 0;
  (globalThis as any).fetch = async (url: string, init: any = {}) => {
    const method: string = init.method ?? 'GET';
    const auth: string | undefined = init.headers?.Authorization;
    const log = (status: number) => fb.requests.push({ method, url, auth, status });
    const isDoc = url.includes('/documents/users/');
    const kind = isDoc && method === 'PATCH' ? 'write' : 'read';

    if (fb.fault && fb.fault.kind !== 'dropWrite' && (fb.fault.on === 'any' || fb.fault.on === kind) && (isDoc || fb.fault.on === 'any')) {
      const f = fb.fault;
      if (--f.times <= 0) fb.fault = null;
      if (f.kind === 'network') { log(0); throw new TypeError('Network request failed'); }
      if (f.kind === 'http500') { log(500); return err(500, 'UNAVAILABLE'); }
      if (f.kind === 'http403') { log(403); return err(403, 'PERMISSION_DENIED'); }
      if (f.kind === 'http401') { log(401); return err(401, 'UNAUTHENTICATED'); }
    }

    const s = load();
    const body = typeof init.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : init.body;

    if (url.includes('accounts:signInWithPassword')) {
      const a = s.accounts[body.email];
      if (!a || a.password !== body.password) { log(400); return res(400, { error: { message: 'INVALID_LOGIN_CREDENTIALS' } }); }
      s.revoked = s.revoked.filter((u) => u !== a.uid); store(s);
      log(200);
      return res(200, { idToken: `idt:${a.uid}:${++n}`, refreshToken: `rt:${a.uid}`, localId: a.uid, displayName: a.displayName });
    }
    if (url.includes('accounts:lookup')) { log(200); return res(200, { users: [{ emailVerified: true }] }); }
    if (url.includes('accounts:update')) {
      const uid = String(body.idToken).split(':')[1];
      const a = Object.values(s.accounts).find((x) => x.uid === uid);
      if (!a) { log(400); return res(400, { error: { message: 'INVALID_ID_TOKEN' } }); }
      if (body.displayName) a.displayName = body.displayName;
      store(s); log(200); return res(200, {});
    }
    if (url.includes('securetoken')) {
      const rt = decodeURIComponent(String(body).split('refresh_token=')[1] ?? '');
      const uid = rt.split(':')[1];
      if (!rt.startsWith('rt:') || s.revoked.includes(uid)) { log(400); return res(400, { error: { message: 'TOKEN_EXPIRED' } }); }
      log(200);
      return res(200, { id_token: `idt:${uid}:${++n}`, refresh_token: rt });
    }
    if (isDoc) {
      const pathUid = url.split('/documents/users/')[1].split('?')[0];
      const caller = uidOfToken(auth);
      if (!caller) { log(401); return err(401, 'UNAUTHENTICATED'); }
      if (caller !== pathUid) { log(403); return err(403, 'PERMISSION_DENIED'); } // rules: you may only touch your own document
      if (s.revoked.includes(caller)) { log(401); return err(401, 'UNAUTHENTICATED'); }
      if (method === 'GET') {
        if (!s.docs[pathUid]) { log(404); return err(404, 'NOT_FOUND'); }
        log(200); return res(200, s.docs[pathUid]);
      }
      if (method === 'PATCH') {
        if (fb.gate) await fb.gate;
        const dropped = fb.fault?.kind === 'dropWrite';
        if (dropped && --fb.fault!.times <= 0) fb.fault = null;
        const mask = new URL(url).searchParams.getAll('updateMask.fieldPaths');
        const cur = s.docs[pathUid] ?? { fields: {} };
        if (!dropped) {
          if (mask.length) mask.forEach((k) => { if (body.fields[k] !== undefined) cur.fields[k] = body.fields[k]; else delete cur.fields[k]; });
          else cur.fields = body.fields;
          s.docs[pathUid] = cur; store(s);
        }
        log(200); return res(200, cur); // like Firestore, answer with the document as it now stands
      }
    }
    throw new Error('fake backend: unexpected request ' + method + ' ' + url);
  };
}
