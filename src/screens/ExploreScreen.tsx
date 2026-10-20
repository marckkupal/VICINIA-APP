import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { PLACES } from '../data';
import { useActionSheet } from '../components/ActionSheet';
import { s } from '../styles';
import { C } from '../theme';
import { ExploreMap, filterPlaces } from './ExploreMap';
import type { PlaceFilter } from './ExploreMap';
import { PLACE_FILTERS } from './ExploreMap';
import { PlaceDetails, PlaceDirections } from './PlaceDetails';
import type { Place } from '../data';

export function ExploreScreen({ university = 'Technological Institute of the Philippines - Quezon City' }: { university?: string }) {
  const [open, setOpen] = useState<Place | null>(null);
  const [route, setRoute] = useState(false);
  const [filter, setFilter] = useState<PlaceFilter>('all');
  const [showMap, setShowMap] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const sheet = useActionSheet();
  const addMenu = () => sheet.open('Explore', [
    { text: 'Open map', onPress: () => setShowMap(true) },
    { text: 'Clear filters', onPress: () => { setFilter('all'); setQuery(''); } },
  ]);

  const places = useMemo(() => filterPlaces(PLACES, filter, query), [filter, query]);

  const toggleSave = (id: string) => setSaved((m) => ({ ...m, [id]: !m[id] }));
  if (open && route) return <PlaceDirections place={open} university={university} onBack={() => setRoute(false)} />;
  if (open) {
    return (
      <PlaceDetails
        place={open}
        saved={!!saved[open.id]}
        onToggleSave={() => toggleSave(open.id)}
        onBack={() => setOpen(null)}
        onDirections={open.id === '1' ? () => setRoute(true) : undefined}
        backLabel={showMap ? 'Back to map' : undefined}
      />
    );
  }
  if (showMap) {
    return (
      <ExploreMap
        places={PLACES}
        query={query} onQuery={setQuery} filter={filter} onFilter={setFilter}
        selectedId={selectedId} onSelect={setSelectedId}
        saved={saved} onToggleSave={toggleSave}
        onBack={() => setShowMap(false)}
        onOpen={setOpen}
        onDirections={(p) => { setOpen(p); setRoute(true); }}
      />
    );
  }

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.libHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.libTitle}>Explore nearby</Text>
          <Text style={s.libSub}>Places around TIP Quezon City</Text>
        </View>
        <TouchableOpacity style={s.libAddBtn} onPress={addMenu} accessibilityLabel="Explore options">
          <Text style={{ fontWeight: '900', fontSize: 20, color: C.yellow, marginTop: -1 }}>+</Text>
        </TouchableOpacity>
      </View>

      <SearchBar filter placeholder="Search cafes, study spaces…" value={query} onChangeText={setQuery} />

      <View style={s.exploreBanner}>
        <View style={s.exploreMapThumb}><Text style={{ fontSize: 30 }}>🗺️</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.postName}>View map</Text>
          <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>Open the Explore map to browse nearby places.</Text>
          <TouchableOpacity style={s.openMapPill} onPress={() => setShowMap(true)} accessibilityRole="button" accessibilityLabel="Open map">
            <Text style={{ fontSize: 12, marginRight: 6 }}>🗺️</Text>
            <Text style={s.tilePillText}>Open map</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.eyebrow}>EXPLORE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {PLACE_FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity key={f.key} style={[s.filterChip, active && s.filterChipActive]} onPress={() => setFilter(f.key)}>
              {f.icon && <Text style={{ marginRight: 6 }}>{f.icon}</Text>}
              <Text style={[s.filterChipText, active && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {places.map((p) => (
        <TouchableOpacity key={p.id} style={s.placeCard} activeOpacity={0.8} onPress={() => setOpen(p)}>
          <View style={s.placeThumb}><Text style={{ fontSize: 40 }}>{p.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.placeName}>{p.name}</Text>
            <Text style={s.placeMeta}>{[p.type, p.price, p.distance].filter(Boolean).join(' · ')}</Text>
            <Text style={s.placeStatus}>{p.status}</Text>
          </View>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => toggleSave(p.id)}
            accessibilityLabel={saved[p.id] ? 'Remove bookmark' : 'Bookmark place'}
          >
            <Text style={{ fontSize: 20, opacity: saved[p.id] ? 1 : 0.35 }}>🔖</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {places.length === 0 && (
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={[s.hint, { marginTop: 0, marginBottom: 8 }]}>No places match your search.</Text>
          <TouchableOpacity onPress={() => { setQuery(''); setFilter('all'); }}><Text style={s.linkBtnText}>Clear search and filters</Text></TouchableOpacity>
        </View>
      )}

      <View style={s.popularCard}>
        <Text style={{ fontSize: 18, marginRight: 12 }}>✨</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.postName}>Popular after class</Text>
          <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>Cubao spots get busier after 5 PM.</Text>
        </View>
      </View>
      <View style={{ height: 24 }} />
      {sheet.node}
    </ScrollView>
  );
}
