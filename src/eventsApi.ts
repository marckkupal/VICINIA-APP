import { firebaseConfig } from './firebase';
import { eventsAuth } from './auth';
import { docToEvent, eventToFields, type NewEvent } from './eventModel';
import type { CampusEvent } from './data';

// Firestore REST access to the `events` collection (same style as auth.ts: no extra packages).
const DOCS = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const KEY = firebaseConfig.apiKey;
export const eventsConfig = { timeoutMs: 15000 }; // a request that takes longer than this fails with 'events/timeout' (changeable in tests)
const fail = (code: string): never => { throw { code }; };

async function call(url: string, init: RequestInit, token?: string): Promise<any> {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctl?.abort(), eventsConfig.timeoutMs);
  let res!: Response;
  try {
    res = await fetch(url, { ...init, signal: ctl?.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  } catch (e: any) {
    return fail(e?.name === 'AbortError' ? 'events/timeout' : 'events/network');
  } finally {
    clearTimeout(timer);
  }
  const json: any = await res.json().catch(() => null);
  if (!res.ok) {
    const e = Array.isArray(json) ? json[0]?.error : json?.error;
    const status = String(e?.status ?? '');
    return fail(
      status === 'PERMISSION_DENIED' ? 'permission-denied'
      : status === 'UNAUTHENTICATED' ? 'auth/session-expired'
      : status === 'NOT_FOUND' ? 'not-found'
      : status === 'UNAVAILABLE' || res.status >= 500 ? 'unavailable'
      : `firestore/${status || res.status || 'unknown'}`
    );
  }
  return json;
}

export interface FeedResult { events: CampusEvent[]; skipped: number }

// Events starting from `since` on (default: two weeks back, so the week strip can still show last week), soonest first.
export async function fetchEvents(since = new Date(Date.now() - 14 * 86400000)): Promise<FeedResult> {
  const { token } = await eventsAuth();
  const json = await call(`${DOCS}:runQuery?key=${KEY}`, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'events' }],
        where: { fieldFilter: { field: { fieldPath: 'startsAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: since.toISOString() } } },
        orderBy: [{ field: { fieldPath: 'startsAt' }, direction: 'ASCENDING' }],
        limit: 300,
      },
    }),
  }, token);
  if (!Array.isArray(json)) return fail('events/bad-response');
  const docs = json.filter((r: any) => r?.document);
  const events = docs.map((r: any) => docToEvent(r.document)).filter((e): e is CampusEvent => !!e);
  return { events, skipped: docs.length - events.length };
}

// Creates the event on the server and returns it as stored. Needs a signed-in account; Firestore rules decide who may post.
export async function createEvent(input: NewEvent): Promise<CampusEvent> {
  const { token, uid, email } = await eventsAuth();
  if (!token || !uid) return fail('auth/no-session');
  const fields = eventToFields(input, { uid, email: email ?? '' });
  const doc = await call(`${DOCS}/events?key=${KEY}`, { method: 'POST', body: JSON.stringify({ fields }) }, token);
  const ev = docToEvent(doc);
  if (!ev || ev.title !== input.title.trim()) return fail('firestore/not-persisted'); // a 2xx reply that did not store what we sent
  return ev;
}

export const friendlyEventsError = (e: any): string => {
  switch (e?.code) {
    case 'events/network': return 'No internet connection. Check your network and try again.';
    case 'events/timeout': return 'The server took too long to answer. Try again in a moment.';
    case 'unavailable': return 'Events are temporarily unavailable. Try again in a moment.';
    case 'permission-denied': return 'You are not allowed to view or post events right now. Log in and try again.';
    case 'not-found': return 'The events database is not set up yet.';
    case 'events/bad-response': return 'The server sent events in a format the app could not read.';
    case 'auth/no-session':
    case 'auth/session-expired': return 'Log in again to post an event.';
    case 'firestore/not-persisted': return 'The event could not be confirmed on the server. Please try again.';
    default: return 'Could not load events. Please try again.';
  }
};
