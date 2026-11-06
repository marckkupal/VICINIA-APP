import type { PlaceKind } from './data';
import { C } from './theme';

// One look per category so markers can be told apart at a glance. Colour is never the only cue: each category also has its own
// shape (circle / rounded square / diamond) and its own emoji.
export type MarkerShape = 'circle' | 'square' | 'diamond';
export interface MarkerStyle { label: string; color: string; soft: string; shape: MarkerShape; icon: string }

export const MARKER_STYLES: Record<PlaceKind, MarkerStyle> = {
  study: { label: 'Study', color: '#3D5FC4', soft: '#E6EDFB', shape: 'square', icon: '📖' },
  food: { label: 'Food', color: C.orange, soft: '#F8E7E2', shape: 'circle', icon: '🍴' },
  orgs: { label: 'Orgs', color: C.green, soft: '#E3F0E4', shape: 'diamond', icon: '👥' },
};

export const markerStyle = (kind: PlaceKind): MarkerStyle => MARKER_STYLES[kind] ?? MARKER_STYLES.study;

// Clips a post to a short preview for the marker popup.
export function snippet(text: string | undefined, max = 90) {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
