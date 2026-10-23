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
