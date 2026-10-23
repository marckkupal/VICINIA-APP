import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { PLACES, inExploreScope } from '../data';
import { useActionSheet } from '../components/ActionSheet';
import { s } from '../styles';
import { C } from '../theme';
import { ExploreMap, filterPlaces } from './ExploreMap';
import type { PlaceFilter } from './ExploreMap';
import { PLACE_FILTERS } from './ExploreMap';
import { PlaceDetails, PlaceDirections } from './PlaceDetails';
import type { Place } from '../data';
import { PostSection } from '../components/PostSection';
import type { User } from '../types';
import { toggleSavedPlace, useMembership } from '../membership';
import { useBusinesses } from '../businesses';
import { PostBusiness } from './PostBusiness';
import { useToast } from '../components/Toast';

export function ExploreScreen({ university = 'Technological Institute of the Philippines - Quezon City', user }: { university?: string; user?: User | null }) {
  const [open, setOpen] = useState<Place | null>(null);
  const [route, setRoute] = useState(false);
  const [filter, setFilter] = useState<PlaceFilter>('all');
  const [showMap, setShowMap] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const mem = useMembership(user?.email);
  const saved: Record<string, boolean> = Object.fromEntries(mem.places.map((id) => [id, true]));
  const [posting, setPosting] = useState(false);
  const [postingBiz, setPostingBiz] = useState(false);
  const businesses = useBusinesses();
  const toast = useToast();
  const allPlaces = useMemo(() => [...businesses, ...PLACES].filter((p) => inExploreScope(p.distance)), [businesses]);

  const sheet = useActionSheet();
  const addMenu = () => sheet.open('Explore', [
    { text: 'Post your business', onPress: () => setPostingBiz(true) },
    { text: 'New post', onPress: () => setPosting(true) },
    { text: 'Open map', onPress: () => setShowMap(true) },
    { text: 'Clear filters', onPress: () => { setFilter('all'); setQuery(''); } },
  ]);

  const places = useMemo(() => filterPlaces(allPlaces, filter, query), [allPlaces, filter, query]);

  const toggleSave = (id: string) => toggleSavedPlace(user?.email, id);
  if (postingBiz) {
    return <PostBusiness ownerEmail={user?.email} onBack={() => setPostingBiz(false)} onPosted={(p) => { setPostingBiz(false); setFilter('all'); setQuery(''); toast.show(`“${p.name}” is now listed in Explore`); }} />;
  }
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
        places={allPlaces}
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
    <View style={s.screen}>
      <View style={s.libHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.libTitle}>Explore nearby</Text>
          <Text style={s.libSub}>Places around TIP Quezon City</Text>
        </View>
        <TouchableOpacity style={s.libAddBtn} onPress={addMenu} accessibilityLabel="Explore options">
          <Text style={{ fontWeight: '900', fontSize: 22, color: C.dark, marginTop: -1 }}>+</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={s.fill} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        <TouchableOpacity style={s.bizCard} activeOpacity={0.85} onPress={() => setPostingBiz(true)} accessibilityRole="button" accessibilityLabel="Post your business">
          <View style={s.bizIcon}><Text style={{ fontSize: 26 }}>🏪</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.postName}>Own a business nearby?</Text>
            <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>Post it with its location so students can find you.</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.dark }}>→</Text>
        </TouchableOpacity>
        {toast.node}

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
              <Text style={s.placeMeta}>{[p.type, p.price, p.business ? p.address : p.distance].filter(Boolean).join(' · ')}</Text>
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
        <PostSection page="explore" user={user} tags={['Food', 'Study', 'Hangout', 'Tip']} placeholder="Share a place or tip…" open={posting} onClose={() => setPosting(false)} />
        <View style={{ height: 24 }} />
        {sheet.node}
      </ScrollView>
    </View>
  );
}
