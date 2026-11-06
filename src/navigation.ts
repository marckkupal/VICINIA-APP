import { useEffect, useRef } from 'react';
import type { TabKey } from './types';

// Lets any screen ask the bottom tab bar to switch tabs (e.g. Guidance Office -> Events),
// without the main app file having to pass a function down through every screen.
type Listener = (t: TabKey) => void;
const listeners = new Set<Listener>();

export function goToTab(tab: TabKey) {
  listeners.forEach((l) => l(tab));
}

// Used by TabBar: calls onChange whenever a screen requests a tab.
export function useTabRequests(onChange: (t: TabKey) => void) {
  const ref = useRef(onChange);
  ref.current = onChange;
  useEffect(() => {
    const l: Listener = (t) => ref.current(t);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
}

// Open a specific item inside another tab (e.g. a search result on Home -> that event inside the Events tab).
// The request waits here until the target tab's screen picks it up, whether that screen is already mounted or mounts after the switch.
export type NavTarget = { kind: 'event' | 'place' | 'board'; id: string };
const pending: Partial<Record<TabKey, NavTarget>> = {};
const targetListeners = new Set<() => void>();

export function openInTab(tab: TabKey, target: NavTarget) {
  pending[tab] = target;
  targetListeners.forEach((l) => l());
  goToTab(tab);
}

// Used by a tab's main screen. Pass enabled=false for embedded copies (e.g. inside Profile) so they ignore requests.
export function useTabTarget(tab: TabKey, onTarget: (t: NavTarget) => void, enabled = true) {
  const ref = useRef(onTarget);
  ref.current = onTarget;
  useEffect(() => {
    if (!enabled) return;
    const take = () => {
      const t = pending[tab];
      if (!t) return;
      delete pending[tab];
      ref.current(t);
    };
    take();
    targetListeners.add(take);
    return () => { targetListeners.delete(take); };
  }, [tab, enabled]);
}
