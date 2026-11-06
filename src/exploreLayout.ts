// Pure layout and interaction rules for the Explore map, kept free of React so they can be tested.

export type ExploreView = 'map' | 'list';

/** Minimum touch target (points). Apple HIG recommends 44, Material 48. Markers and buttons use at least this. */
export const MIN_TOUCH = 44;
export const MARKER_HIT = 48;

/** Phones and narrow windows get the stacked, toggled layout. */
export const COMPACT_MAX_WIDTH = 600;
export const isCompact = (width: number) => width < COMPACT_MAX_WIDTH;

/**
 * Map height from the window: about 42% of the height on a phone so the popup below it stays on screen, clamped so it is
 * never tiny on small phones or huge on tablets. Falls back to 340 for bad input (0, NaN) such as before first layout.
 */
export function mapHeight(windowHeight: number, windowWidth: number) {
  if (!Number.isFinite(windowHeight) || !Number.isFinite(windowWidth) || windowHeight <= 0 || windowWidth <= 0) return 340;
  const base = isCompact(windowWidth) ? windowHeight * 0.42 : windowHeight * 0.55;
  return Math.round(Math.min(Math.max(base, 240), 520));
}

/** Tapping a pinned marker selects it, tapping it again clears it, and ids that are not pinned are ignored (never selectable). */
export function nextSelection(current: string | null, tapped: string | null, pinnedIds: string[]): string | null {
  if (tapped === null) return null;
  if (!pinnedIds.includes(tapped)) return current;
  return current === tapped ? null : tapped;
}

/** After a search or filter change, a selection that is no longer on the map is cleared. */
export const reconcileSelection = (current: string | null, pinnedIds: string[]) => (current && pinnedIds.includes(current) ? current : null);

/** The list/map toggle. Jumping to the map from a list row selects that place only when it can be pinned. */
export interface ViewState { view: ExploreView; selectedId: string | null }
export type ViewAction = { type: 'setView'; view: ExploreView } | { type: 'showOnMap'; id: string; pinnedIds: string[] } | { type: 'select'; id: string | null; pinnedIds: string[] };

export function reduceView(st: ViewState, a: ViewAction): ViewState {
  switch (a.type) {
    case 'setView': return { ...st, view: a.view };
    case 'showOnMap': return a.pinnedIds.includes(a.id) ? { view: 'map', selectedId: a.id } : st;
    case 'select': return { ...st, selectedId: nextSelection(st.selectedId, a.id, a.pinnedIds) };
  }
}
