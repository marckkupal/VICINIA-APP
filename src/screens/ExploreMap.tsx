import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LibPage } from '../components/LibPage';
import { SearchBar } from '../components/SearchBar';
import type { Place, PlaceKind } from '../data';
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
    const text = `${p.name} ${p.type} ${KIND_WORDS[p.kind]} ${p.status}`.toLowerCase();
    return tokens.every((t) => text.includes(t));
  });
};

const road = { position: 'absolute', backgroundColor: '#D9D5CA' } as const;

interface Props {
  places: Place[];
  query: string; onQuery: (q: string) => void;
  filter: PlaceFilter; onFilter: (f: PlaceFilter) => void;
  selectedId: string | null; onSelect: (id: string | null) => void;
  saved: Record<string, boolean>; onToggleSave: (id: string) => void;
  onBack: () => void; onOpen: (p: Place) => void; onDirections: (p: Place) => void;
}

// The Explore map: the same illustrative map as Directions, with search, category filters and tappable markers.
export function ExploreMap({ places, query, onQuery, filter, onFilter, selectedId, onSelect, saved, onToggleSave, onBack, onOpen, onDirections }: Props) {
  const visible = filterPlaces(places, filter, query);
  const selected = visible.find((p) => p.id === selectedId) ?? null;
  const clear = () => { onQuery(''); onFilter('all'); onSelect(null); };
  const filtered = filter !== 'all' || query.trim().length > 0;

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

      {/* Illustrative map (same look as Directions) */}
      <View style={{ height: 320, borderRadius: 20, backgroundColor: '#EDEAE0', overflow: 'hidden', marginBottom: 14 }}>
        <View style={{ position: 'absolute', left: '4%', top: '8%', width: '38%', height: '34%', borderRadius: 24, backgroundColor: '#DCE8D2' }} />
        <View style={{ position: 'absolute', right: '3%', top: '26%', width: '24%', height: '40%', borderRadius: 40, backgroundColor: '#D6E4CB' }} />
        <View style={[road, { left: '40%', top: -20, width: 34, height: 380, transform: [{ rotate: '12deg' }] }]} />
        <View style={[road, { left: -20, top: '50%', width: 520, height: 32, backgroundColor: '#DDD9CE', transform: [{ rotate: '-8deg' }] }]} />
        <Text style={{ position: 'absolute', right: 20, bottom: 14, fontSize: 11, color: C.muted, transform: [{ rotate: '8deg' }] }}>Aurora Blvd</Text>

        {/* TIP QC campus */}
        <View style={{ position: 'absolute', left: '30%', top: '28%', marginLeft: -16, marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: C.dark, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.yellow, fontSize: 12 }}>◆</Text>
        </View>
        <Text style={{ position: 'absolute', left: '30%', top: '28%', marginLeft: -20, marginTop: 20, fontSize: 12, fontWeight: '800', color: C.muted }}>TIP QC</Text>

        {visible.map((p) => {
          if (!p.map) return null;
          const on = p.id === selected?.id;
          return (
            <View key={p.id} pointerEvents="box-none" style={{ position: 'absolute', left: `${p.map.x}%`, top: `${p.map.y}%`, marginLeft: -70, marginTop: -18, width: 140, alignItems: 'center', zIndex: on ? 5 : 1 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => onSelect(on ? null : p.id)}
                accessibilityRole="button"
                accessibilityLabel={`${p.name}, ${p.type}`}
                accessibilityState={{ selected: on }}
                style={{ width: on ? 42 : 36, height: on ? 42 : 36, borderRadius: 21, backgroundColor: on ? C.dark : C.yellow, borderWidth: on ? 3 : 2, borderColor: on ? C.yellow : '#fff', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: on ? 18 : 16 }}>{p.emoji}</Text>
              </TouchableOpacity>
              {on && (
                <View style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, maxWidth: 140 }}>
                  <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: C.dark }}>{p.name}</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ position: 'absolute', left: 12, top: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: C.dark }}>ILLUSTRATIVE · NOT LIVE GPS</Text>
        </View>

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

      {/* Selected location */}
      {selected ? (
        <View style={[s.lbCard, { flexDirection: 'column', alignItems: 'stretch', marginBottom: 14 }]}>
          <TouchableOpacity style={s.rowCenter} activeOpacity={0.8} onPress={() => onOpen(selected)} accessibilityRole="button" accessibilityLabel={`Open details for ${selected.name}`}>
            <View style={[s.placeThumb, { width: 64, height: 64, marginRight: 12 }]}><Text style={{ fontSize: 30 }}>{selected.emoji}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.placeName}>{selected.name}</Text>
              <Text style={[s.placeMeta, { fontSize: 13, marginTop: 2 }]}>{[selected.type, selected.price, selected.distance].filter(Boolean).join(' · ')}</Text>
              <Text style={[s.placeStatus, { marginTop: 4 }]}>{selected.status}</Text>
            </View>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => onToggleSave(selected.id)} accessibilityLabel={saved[selected.id] ? 'Remove bookmark' : 'Bookmark place'}>
              <Text style={{ fontSize: 22, opacity: saved[selected.id] ? 1 : 0.35 }}>🔖</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          <View style={[s.rowCenter, { marginTop: 12 }]}>
            <TouchableOpacity style={[s.primaryBtn, { flex: 1, height: 44 }]} onPress={() => onOpen(selected)} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>View details</Text>
            </TouchableOpacity>
            {selected.id === '1' && (
              <TouchableOpacity style={[s.secondaryBtn, { flex: 1, height: 44, marginLeft: 10 }]} onPress={() => onDirections(selected)} activeOpacity={0.8}>
                <Text style={s.secondaryBtnText}>Directions · Demo</Text>
              </TouchableOpacity>
            )}
          </View>
          {selected.id !== '1' && <Text style={[s.lbCardMeta, { marginTop: 8 }]}>Directions aren’t available for this place in the prototype.</Text>}
        </View>
      ) : (
        visible.length > 0 && (
          <View style={[s.popularCard, { marginTop: 0, marginBottom: 14 }]}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.postName}>Tap a marker</Text>
              <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>See a place’s info and open its details.</Text>
            </View>
          </View>
        )
      )}

      {/* Results */}
      <Text style={s.eyebrow}>
        {visible.length} {visible.length === 1 ? 'PLACE' : 'PLACES'}{filtered ? ' MATCH' : ' ON THE MAP'}
      </Text>
      {visible.map((p) => (
        <TouchableOpacity key={p.id} style={[s.placeCard, p.id === selected?.id && { borderColor: C.dark }]} activeOpacity={0.8} onPress={() => onOpen(p)}>
          <View style={[s.placeThumb, { width: 64, height: 64 }]}><Text style={{ fontSize: 30 }}>{p.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.placeName}>{p.name}</Text>
            <Text style={[s.placeMeta, { fontSize: 13 }]}>{[p.type, p.distance].join(' · ')}</Text>
            <Text style={[s.placeStatus, { marginTop: 4 }]}>{p.status}</Text>
          </View>
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>
      ))}
      {visible.length === 0 && <Text style={[s.hint, { marginBottom: 16 }]}>No places match your search. Try another keyword or category.</Text>}
    </LibPage>
  );
}
