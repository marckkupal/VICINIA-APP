import { useEffect, useState } from 'react';
import { acct, loadJSON, saveJSON } from './persist';
import { goToTab } from './navigation';
import type { TabKey } from './types';

// First-time walkthrough (coach marks). Completion is saved per account on this device with the same
// helpers settings.ts uses, so Skip/Done are remembered after the app is closed and it never re-prompts.

export type TourStep = { id: string; target: string; title: string; body: string; tab?: TabKey };

export const TOUR_STEPS: TourStep[] = [
  { id: 'nav', target: 'tabbar', tab: 'home', title: 'Get around', body: 'Home, Explore, Boards, Events and Profile are always one tap away in the bottom bar.' },
  { id: 'boards', target: 'tab-boards', title: 'Find your communities', body: 'Boards are campus communities. Browse them, join the ones you like and follow the conversation.' },
  { id: 'events', target: 'tab-events', title: 'Discover events', body: 'See what is happening around campus, register for events, or post one of your own.' },
  { id: 'post', target: 'quickadd', tab: 'home', title: 'Create a post', body: 'Tap + to share something with the community. You can also post inside any board.' },
];

const KEY = 'vicinia_tour';
type Done = Record<string, true>;
const done: Done = {};
const offered = new Set<string>(); // accounts already auto-prompted in this session
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let state = { open: false, step: 0 };
let ready: Promise<void> | null = null;
// Loads once. Only real `true` values are kept so damaged saved data can't break anything.
const start = () => (ready ??= loadJSON<Record<string, unknown>>(KEY, {}).then((saved) => {
  Object.keys(saved ?? {}).forEach((k) => { if (saved[k] === true) done[k] = true; });
}));
const set = (next: Partial<typeof state>) => { state = { ...state, ...next }; emit(); };

let who = 'guest';

// Called from Home. Opens the tour once per account, only if it was never completed or skipped.
export function maybeStartTour(email?: string | null) {
  const k = acct(email);
  start().then(() => {
    if (done[k] || offered.has(k) || state.open) return;
    offered.add(k);
    who = k;
    setTimeout(() => { if (!done[k] && !state.open) beginAt(0); }, 600); // let Home settle first
  });
}

// Help / Settings entry point. Always works, even if the tour was completed before.
export function replayTour(email?: string | null) {
  who = acct(email);
  offered.add(who);
  beginAt(0);
}

function beginAt(i: number) {
  const step = TOUR_STEPS[i];
  if (step?.tab) goToTab(step.tab);
  set({ open: true, step: i });
}

export const nextStep = () => {
  if (state.step >= TOUR_STEPS.length - 1) return finishTour();
  beginAt(state.step + 1);
};
export const prevStep = () => { if (state.step > 0) beginAt(state.step - 1); };

// Used by both "Skip" and "Done".
export function finishTour() {
  done[who] = true;
  set({ open: false, step: 0 });
  start().then(() => saveJSON(KEY, done));
}

export function useTour() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return state;
}

// Screens register the element a step points at. Plain ref callback: setTarget('quickadd', node).
export type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };
const targets = new Map<string, Measurable>();
export const setTarget = (id: string, node: Measurable | null) => { if (node) targets.set(id, node); else targets.delete(id); };
export const getTarget = (id: string) => targets.get(id);
