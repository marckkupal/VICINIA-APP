import { useEffect, useMemo, useRef } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import type { Place } from '../data';
import { startRegion, usableCampus } from '../geo';
import type { Campus, Pin } from '../geo';
import { markerStyle } from '../exploreMarkers';
import { MARKER_HIT } from '../exploreLayout';
import { C } from '../theme';

// OpenStreetMap tiles shown through react-native-maps.
// tile.openstreetmap.org is fine while developing. Before a wide release, switch TILE_URL to a tile provider
// (MapTiler, Stadia Maps, Thunderforest...) because OSM's own server limits heavy use.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

interface Props {
  /** Verified campus the map opens on. When it is missing or unverified no map is drawn at all. */
  campus: Campus | undefined;
  /** Places already checked against the campus geofence (see geo.ts partitionPins). The map never pins anything else. */
  pins: Pin<Place>[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const SIZE = 36;

// Category look: circle (food), rounded square (study), diamond (orgs), each in its own colour.
function MarkerBadge({ kind, emoji, on }: { kind: Place['kind']; emoji: string; on: boolean }) {
  const st = markerStyle(kind);
  const size = on ? SIZE + 8 : SIZE;
  const shape = st.shape === 'circle' ? { borderRadius: size / 2 } : st.shape === 'square' ? { borderRadius: 9 } : { borderRadius: 6, transform: [{ rotate: '45deg' }] };
  return (
    <View style={[{ width: size, height: size, backgroundColor: on ? C.dark : st.color, borderWidth: on ? 3 : 2, borderColor: on ? st.color : '#fff', alignItems: 'center', justifyContent: 'center' }, shape]}>
      <Text style={{ fontSize: on ? 18 : 16, transform: st.shape === 'diamond' ? [{ rotate: '-45deg' }] : undefined }}>{emoji}</Text>
    </View>
  );
}

// Fills its parent, so wrap it in a View with a fixed height.
export function OsmMap({ campus, pins, selectedId, onSelect }: Props) {
  const ref = useRef<MapView>(null);
  const region = useMemo(() => startRegion(campus), [campus]);

  // Centre the map on a place when it is selected. Only pins that passed the geofence are ever in `pins`.
  useEffect(() => {
    const p = pins.find((x) => x.item.id === selectedId);
    if (p) ref.current?.animateCamera({ center: { latitude: p.coord.lat, longitude: p.coord.lng } }, { duration: 300 });
  }, [selectedId, pins]);

  if (!region || !usableCampus(campus)) {
    return (
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#EDEAE0' }]}>
        <Text style={{ fontSize: 28, marginBottom: 6 }}>🗺️</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark, textAlign: 'center' }}>Map pins aren’t available yet</Text>
        <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 4 }}>Places are listed below.</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        // OSM tiles cover the base map. 'none' only exists on Android, so iOS uses the muted style underneath.
        mapType={Platform.OS === 'android' ? 'none' : 'mutedStandard'}
        userInterfaceStyle="light"
        initialRegion={region}
        maxZoomLevel={19}
        rotateEnabled={false}
        pitchEnabled={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        onPress={() => onSelect(null)}
      >
        <UrlTile urlTemplate={TILE_URL} maximumZ={19} flipY={false} />

        {/* Verified campus centre */}
        <Marker coordinate={{ latitude: campus.center.lat, longitude: campus.center.lng }} anchor={{ x: 0.5, y: 0.5 }} title={campus.name} tracksViewChanges={false}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.dark, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.yellow, fontSize: 12 }}>◆</Text>
          </View>
        </Marker>

        {pins.map(({ item: p, coord }) => {
          const on = p.id === selectedId;
          return (
            <Marker
              key={p.id}
              coordinate={{ latitude: coord.lat, longitude: coord.lng }}
              anchor={{ x: 0.5, y: 0.33 }}
              zIndex={on ? 5 : 1}
              onPress={(e) => { e.stopPropagation(); onSelect(on ? null : p.id); }}
              accessibilityLabel={`${p.name}, ${markerStyle(p.kind).label}, ${p.type}`}
            >
              <View style={{ width: 140, height: 72, alignItems: 'center' }}>
                {/* Transparent padding keeps the tap area at least MARKER_HIT wide and tall even though the badge is 36 */}
                <View style={{ minWidth: MARKER_HIT, minHeight: MARKER_HIT, alignItems: 'center', justifyContent: 'center' }}>
                <MarkerBadge kind={p.kind} emoji={p.emoji} on={on} />
                </View>
                {on && (
                  <View style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, maxWidth: 140 }}>
                    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: C.dark }}>{p.name}</Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Required by the OpenStreetMap license. */}
      <TouchableOpacity
        style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}
        onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}
        accessibilityRole="link"
        accessibilityLabel="OpenStreetMap copyright"
      >
        <Text style={{ fontSize: 10, color: '#333' }}>© OpenStreetMap contributors</Text>
      </TouchableOpacity>
    </View>
  );
}
