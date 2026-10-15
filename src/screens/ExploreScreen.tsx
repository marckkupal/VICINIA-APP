import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { PLACES } from '../data';
import type { PlaceKind } from '../data';
import { s } from '../styles';
import { C } from '../theme';

type Filter = 'all' | PlaceKind;
const FILTERS: { key: Filter; label: string; icon?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'study', label: 'Study', icon: '📖' },
  { key: 'food', label: 'Food', icon: '🍴' },
  { key: 'orgs', label: 'Orgs', icon: '👥' },
];

export function ExploreScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const places = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLACES.filter(
      (p) => (filter === 'all' || p.kind === filter) && (!q || `${p.name} ${p.type}`.toLowerCase().includes(q))
    );
  }, [filter, query]);

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.libHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.libTitle}>Explore nearby</Text>
          <Text style={s.libSub}>Places around TIP Quezon City</Text>
        </View>
        <TouchableOpacity style={s.libAddBtn}>
          <Text style={{ fontWeight: '900', fontSize: 20, color: C.yellow, marginTop: -1 }}>+</Text>
        </TouchableOpacity>
      </View>

      <SearchBar filter placeholder="Search cafes, study spaces…" value={query} onChangeText={setQuery} />

      <View style={s.exploreBanner}>
        <View style={s.exploreMapThumb}><Text style={{ fontSize: 30 }}>🗺️</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.postName}>View map</Text>
          <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>Open the Explore map to browse nearby places.</Text>
          <TouchableOpacity style={s.openMapPill} onPress={() => Alert.alert('Explore map', 'The map view is coming soon.')}>
            <Text style={{ fontSize: 12, marginRight: 6 }}>🗺️</Text>
            <Text style={s.tilePillText}>Open map</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.eyebrow}>EXPLORE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => {
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
        <TouchableOpacity key={p.id} style={s.placeCard} activeOpacity={0.8}>
          <View style={s.placeThumb}><Text style={{ fontSize: 40 }}>{p.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.placeName}>{p.name}</Text>
            <Text style={s.placeMeta}>{[p.type, p.price, p.distance].filter(Boolean).join(' · ')}</Text>
            <Text style={s.placeStatus}>{p.status}</Text>
          </View>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setSaved((m) => ({ ...m, [p.id]: !m[p.id] }))}
            accessibilityLabel={saved[p.id] ? 'Remove bookmark' : 'Bookmark place'}
          >
            <Text style={{ fontSize: 20, opacity: saved[p.id] ? 1 : 0.35 }}>🔖</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {places.length === 0 && <Text style={[s.hint, { marginBottom: 16 }]}>No places match your search.</Text>}

      <View style={s.popularCard}>
        <Text style={{ fontSize: 18, marginRight: 12 }}>✨</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.postName}>Popular after class</Text>
          <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>Cubao spots get busier after 5 PM.</Text>
        </View>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
