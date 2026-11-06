import { useEffect, useSyncExternalStore } from 'react';
import type { CampusEvent } from './data';
import { startMs } from './eventModel';
import { fetchEvents, type FeedResult } from './eventsApi';
import { loadJSON, saveJSON } from './persist';

// The events feed: loads from the server, keeps the last good copy on the device, and tells screens what state it is in.
//   idle     nothing asked yet
//   loading  first load, nothing to show yet            -> skeleton
//   ready    events available (maybe stale: see `error`) -> list; `error` set = the latest refresh failed, showing saved copy
//   error    load failed and there is nothing to show    -> error state with Retry
export type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';
export interface FeedState { status: FeedStatus; events: CampusEvent[]; error: any | null; refreshing: boolean; loadedAt: number | null; skipped: number }

export interface FeedDeps {
  fetch: () => Promise<FeedResult>;
  loadCache: () => Promise<{ events: CampusEvent[] } | null>;
  saveCache: (events: CampusEvent[]) => Promise<void>;
  now?: () => number;
}

const sortEvents = (list: CampusEvent[]) => [...list].sort((a, b) => startMs(a) - startMs(b));
const STALE_MS = 60_000;

export function createEventsFeed(deps: FeedDeps) {
  const now = deps.now ?? Date.now;
  let state: FeedState = { status: 'idle', events: [], error: null, refreshing: false, loadedAt: null, skipped: 0 };
  const listeners = new Set<() => void>();
  const set = (patch: Partial<FeedState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };
  let inflight: Promise<void> | null = null;
  let cacheTried = false;

  const run = async () => {
    set({ status: state.events.length ? 'ready' : 'loading', refreshing: true, error: null });
    if (!cacheTried) { // show the saved copy right away while the network call runs
      cacheTried = true;
      const cached = await deps.loadCache().catch(() => null);
      if (cached?.events?.length && !state.events.length) set({ events: sortEvents(cached.events), status: 'ready' });
    }
    try {
      const r = await deps.fetch();
      const events = sortEvents(r.events);
      set({ events, status: 'ready', error: null, refreshing: false, loadedAt: now(), skipped: r.skipped });
      deps.saveCache(events).catch(() => {});
    } catch (e) {
      // keep whatever we have; only a feed with nothing to show becomes a full error
      set({ status: state.events.length ? 'ready' : 'error', error: e ?? { code: 'unknown' }, refreshing: false });
    }
  };

  return {
    getState: () => state,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    // Fetches now. A call while one is already running joins it (no double requests).
    refresh(): Promise<void> {
      if (!inflight) inflight = run().finally(() => { inflight = null; });
      return inflight;
    },
    // Loads when nothing was loaded, the last load failed, or the data is older than a minute.
    ensureFresh(): Promise<void> {
      const stale = state.loadedAt === null || state.status === 'error' || state.error !== null || now() - state.loadedAt > STALE_MS;
      return stale ? this.refresh() : Promise.resolve();
    },
    // Adds an event the server just confirmed, so it shows up without waiting for the next refresh.
    upsert(ev: CampusEvent) {
      const rest = state.events.filter((x) => x.id !== ev.id);
      set({ events: sortEvents([...rest, ev]), status: 'ready' });
      deps.saveCache(state.events).catch(() => {});
    },
  };
}

const CACHE_KEY = 'vicinia_events_cache';
export const eventsFeed = createEventsFeed({
  fetch: () => fetchEvents(),
  loadCache: () => loadJSON<{ events: CampusEvent[] } | null>(CACHE_KEY, null),
  saveCache: (events) => saveJSON(CACHE_KEY, { savedAt: Date.now(), events }),
});

// React hook: the feed state, and a refresh when the screen opens.
export function useEventFeed(): FeedState & { refresh: () => Promise<void> } {
  const st = useSyncExternalStore(eventsFeed.subscribe, eventsFeed.getState, eventsFeed.getState);
  useEffect(() => { eventsFeed.ensureFresh(); }, []);
  return { ...st, refresh: () => eventsFeed.refresh() };
}
