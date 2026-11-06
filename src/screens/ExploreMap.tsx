import { useEffect, useReducer } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LibPage } from '../components/LibPage';
import { OsmMap } from '../components/OsmMap';
import { SearchBar } from '../components/SearchBar';
import type { Place, PlaceKind } from '../data';
import { fmtKm, mapCampuses, partitionPins } from '../geo';
import { MARKER_STYLES, markerStyle, snippet } from '../exploreMarkers';
import type { Post } from '../types';
import { MIN_TOUCH, isCompact, mapHeight, nextSelection, reconcileSelection, reduceView } from '../exploreLayout';
import { s } from '../styles';
import { C } from '../theme';

export type PlaceFilter = 'all' | PlaceKind;
export const PLACE_FILTERS: { key: PlaceFilter; label: string; icon?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'study', label: 'Study', icon: '📖' },
  { key: 'food', label: 'Food', icon: '🍴' },
  { key: 'orgs', label: 'Orgs', icon: '👥' },
];

const KIND_WORDS: Record<PlaceKind, string> = { study: 'study', food: 'food eat', orgs: 'orgs organization community club' };

// Shared by the Explore list and the Explore map so both always show the same results.
export const filterPlaces = (places: Place[], filter: PlaceFilter, query: string) => {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return places.filter((p) => {
    if (filter !== 'all' && p.kind !== filter) return false;
    const text = `${p.name} ${p.type} ${KIND_WORDS[p.kind]} ${p.status} ${p.building ?? ''}`.toLowerCase();
    return tokens.every((t) => text.includes(t));
  });
};

interface Props {
  places: Place[];
  query: string; onQuery: (q: string) => void;
  filter: PlaceFilter; onFilter: (f: PlaceFilter) => void;
  selectedId: string | null; onSelect: (id: string | null) => void;
  saved: Record<string, boolean>; onToggleSave: (id: string) => void;
  posts?: Post[]; // Explore posts (each may carry a location.placeId), used for the popup snippet
  onBack: () => void; onOpen: (p: Place) => void; onDirections: (p: Place) => void;
}

// The Explore map: a real OpenStreetMap view with search, category filters and tappable markers.
export function ExploreMap({ places, query, onQuery, filter, onFilter, selectedId, onSelect, saved, onToggleSave, posts = [], onBack, onOpen, onDirections }: Props) {
  const visible = filterPlaces(places, filter, query);
  // Only places that pass the verified-campus geofence get a pin. The rest stay in the list below.
  const campus = mapCampuses()[0];
  const { pins, unpinned: listOnly } = partitionPins(visible);
  const { width, height } = useWindowDimensions();
  const compact = isCompact(width);
  const pinnedIds = pins.map((x) => x.item.id);
  // List/map toggle. On a phone the two are separate views so the map gets the whole width and the list is not squeezed under it.
  const [vs, dispatch] = useReducer(reduceView, { view: 'map', selectedId: null });
  const mapAvailable = !!campus; // no verified campus -> no map and no toggle, just the list
  const showMap = mapAvailable && vs.view === 'map';
  const showList = !showMap || pins.length === 0; // never leave the screen empty when nothing can be pinned
  // A search or filter can drop the selected place from the map: clear it.
  useEffect(() => {
    const keep = reconcileSelection(selectedId, pinnedIds);
    if (keep !== selectedId) onSelect(keep);
  }, [pinnedIds.join('|'), selectedId]);
  const pick = (id: string | null) => onSelect(nextSelection(selectedId, id, pinnedIds));
  const selectedPin = pins.find((x) => x.item.id === selectedId) ?? null;
  const selected = selectedPin?.item ?? null;
  const latestPost = selected ? posts.find((q) => q.location?.placeId === selected.id) : undefined;
  const clear = () => { onQuery(''); onFilter('all'); onSelect(null); };
  const filtered = filter !== 'all' || query.trim().length > 0;
  const unpinned = listOnly.length; // places without a valid, in-campus position are listed but not pinned

  return (
    <LibPage
      title="Explore map"
      sub="Places around TIP Quezon City"
      onBack={onBack}
      footer={
        <TouchableOpacity style={s.secondaryBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={s.secondaryBtnText}>Back to Explore</Text>
        </TouchableOpacity>
      }
    >
      <SearchBar filter placeholder="Search cafes, study spaces…" value={query} onChangeText={onQuery} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14, flexGrow: 0 }} keyboardShouldPersistTaps="handled">
        {PLACE_FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity key={f.key} style={[s.filterChip, active && s.filterChipActive]} onPress={() => onFilter(f.key)} accessibilityRole="button" accessibilityState={{ selected: active }}>
              {f.icon && <Text style={{ marginRight: 6 }}>{f.icon}</Text>}
              <Text style={[s.filterChipText, active && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Map / List toggle */}
      {mapAvailable && <View style={{ flexDirection: 'row', backgroundColor: '#EFECE2', borderRadius: 14, padding: 4, marginBottom: 12 }} accessibilityRole="tablist">
        {(['map', 'list'] as const).map((v) => {
          const on = vs.view === v;
          return (
            <TouchableOpacity key={v} onPress={() => dispatch({ type: 'setView', view: v })} activeOpacity={0.8} accessibilityRole="tab" accessibilityState={{ selected: on }}
              accessibilityLabel={v === 'map' ? 'Show map' : 'Show list'}
              style={{ flex: 1, minHeight: MIN_TOUCH, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#fff' : 'transparent' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: on ? C.dark : C.muted }}>{v === 'map' ? '🗺️  Map' : `📋  List (${visible.length})`}</Text>
            </TouchableOpacity>
          );
        })}
      </View>}
      {!mapAvailable && <Text style={[s.hint, { marginTop: 0, marginBottom: 14 }]}>The map isn’t available yet. Places are listed below.</Text>}

      {showMap && (<>
      {/* Marker legend: one colour, shape and icon per category */}
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {(Object.keys(MARKER_STYLES) as PlaceKind[]).map((k) => {
          const m = MARKER_STYLES[k];
          return (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
              <View style={{ width: 12, height: 12, backgroundColor: m.color, marginRight: 6, borderRadius: m.shape === 'circle' ? 6 : m.shape === 'square' ? 3 : 2, transform: m.shape === 'diamond' ? [{ rotate: '45deg' }] : undefined }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.dark }}>{m.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Real map: OpenStreetMap tiles around TIP QC */}
      <View style={{ height: mapHeight(height, width), borderRadius: 20, backgroundColor: '#EDEAE0', overflow: 'hidden', marginBottom: unpinned > 0 ? 8 : 14 }}>
        <OsmMap campus={campus} pins={pins} selectedId={selected?.id ?? null} onSelect={pick} />

        {visible.length === 0 && (
          <View style={{ position: 'absolute', left: 24, right: 24, top: '30%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 26, marginBottom: 6 }}>🔎</Text>
            <Text style={s.postName}>No places found</Text>
            <Text style={[s.muted, { fontSize: 13, marginTop: 4, textAlign: 'center' }]}>Try a different search or category.</Text>
            <TouchableOpacity style={[s.openMapPill, { backgroundColor: C.yellow, marginTop: 10 }]} onPress={clear} accessibilityRole="button">
              <Text style={s.tilePillText}>Clear search & filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {unpinned > 0 && (
        <Text style={[s.hint, { marginTop: 0, marginBottom: 14 }]}>
          {unpinned} {unpinned === 1 ? 'place has' : 'places have'} no pin on the map yet. {unpinned === 1 ? 'It is' : 'They are'} still in the list below.
        </Text>
      )}

      {/* Selected marker: info popup with title, distance or building, a post snippet and the actions */}
      {selected && selectedPin ? (
        <View style={[s.lbCard, { flexDirection: 'column', alignItems: 'stretch', marginBottom: 14, borderLeftWidth: 5, borderLeftColor: markerStyle(selected.kind).color }]} accessibilityLiveRegion="polite">
          <View style={s.rowCenter}>
            <View style={[s.placeThumb, { width: 56, height: 56, marginRight: 12, backgroundColor: markerStyle(selected.kind).soft }]}><Text style={{ fontSize: 28 }}>{selected.emoji}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: markerStyle(selected.kind).color }}>{markerStyle(selected.kind).label.toUpperCase()} · {selected.type.toUpperCase()}</Text>
              <Text style={[s.placeName, { marginTop: 2 }]}>{selected.name}</Text>
              <Text style={[s.placeMeta, { fontSize: 13, marginTop: 2 }]}>{[selected.building, `${fmtKm(selectedPin.kmFromCampus)} from campus`, selected.price].filter(Boolean).join(' · ')}</Text>
              <Text style={[s.placeStatus, { marginTop: 4 }]}>{selected.status}</Text>
            </View>
            <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }} onPress={() => onToggleSave(selected.id)} accessibilityLabel={saved[selected.id] ? 'Remove bookmark' : 'Bookmark place'}>
              <Text style={{ fontSize: 22, opacity: saved[selected.id] ? 1 : 0.35 }}>🔖</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', marginRight: -8 }} onPress={() => onSelect(null)} accessibilityRole="button" accessibilityLabel="Close place info">
              <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: '#FAF8F1', borderRadius: 12, padding: 10, marginTop: 12 }}>
            {latestPost ? (
              <>
                <Text style={{ fontSize: 12, fontWeight: '800', color: C.dark }}>{latestPost.title}</Text>
                {!!snippet(latestPost.body) && <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{snippet(latestPost.body)}</Text>}
              </>
            ) : (
              <Text style={{ fontSize: 13, color: C.muted }}>No posts about this place yet.</Text>
            )}
          </View>
          <View style={[s.rowCenter, { marginTop: 12 }]}>
            <TouchableOpacity style={[s.primaryBtn, { flex: 1, height: MIN_TOUCH }]} onPress={() => onOpen(selected)} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>View details</Text>
            </TouchableOpacity>
            {selected.id === '1' && (
              <TouchableOpacity style={[s.secondaryBtn, { flex: 1, height: MIN_TOUCH, marginLeft: 10 }]} onPress={() => onDirections(selected)} activeOpacity={0.8}>
                <Text style={s.secondaryBtnText}>Directions · Demo</Text>
              </TouchableOpacity>
            )}
          </View>
          {selected.id !== '1' && <Text style={[s.lbCardMeta, { marginTop: 8 }]}>Directions aren’t available for this place in the prototype.</Text>}
        </View>
      ) : (
        pins.length > 0 && (
          <View style={[s.popularCard, { marginTop: 0, marginBottom: 14 }]}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.postName}>Tap a marker</Text>
              <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>See a place’s info and open its details.</Text>
            </View>
          </View>
        )
      )}

      </>)}

      {/* Results */}
      {showList && <Text style={s.eyebrow}>
        {visible.length} {visible.length === 1 ? 'PLACE' : 'PLACES'}{filtered ? ' MATCH' : pins.length > 0 ? ' AROUND CAMPUS' : ''}
      </Text>}
      {showList && visible.map((p) => (
        <TouchableOpacity key={p.id} style={[s.placeCard, p.id === selected?.id && { borderColor: markerStyle(p.kind).color }]} activeOpacity={0.8} onPress={() => onOpen(p)}>
          <View style={[s.placeThumb, { width: 64, height: 64 }]}><Text style={{ fontSize: 30 }}>{p.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.placeName}>{p.name}</Text>
            <Text style={[s.placeMeta, { fontSize: 13 }]}>{[p.type, p.distance].join(' · ')}</Text>
            <Text style={[s.placeStatus, { marginTop: 4 }]}>{p.status}</Text>
          </View>
          {mapAvailable && pinnedIds.includes(p.id) && (
            <TouchableOpacity style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }} onPress={() => { dispatch({ type: 'showOnMap', id: p.id, pinnedIds }); onSelect(p.id); }} accessibilityRole="button" accessibilityLabel={`Show ${p.name} on the map`}>
              <Text style={{ fontSize: 20 }}>📍</Text>
            </TouchableOpacity>
          )}
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>
      ))}
      {showList && visible.length === 0 && <Text style={[s.hint, { marginBottom: 16 }]}>No places match your search. Try another keyword or category.</Text>}
    </LibPage>
  );
}
