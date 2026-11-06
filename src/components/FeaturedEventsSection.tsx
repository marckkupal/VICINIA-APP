import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { CampusEvent } from '../data';
import { eventsEmptyFor, filterEventsByStatus, statusOptions, type StatusFilter } from '../content/filters';
import { C } from '../theme';
import { StatusBadge, UnconfirmedLabel, whenText } from './EventBadges';
import { FilterChips } from './FilterChips';
import { SafeImage } from './SafeImage';

// The Events page's featured events. The caller passes the events resolved from FEATURED_EVENT_IDS (src/featuredEvents.ts).
// Each poster is drawn at its own aspect ratio, so portrait, square and landscape posters all show whole.
// The Past / Upcoming / Date TBA chips only filter what is shown; the featured list itself stays exactly the configured events.
export function FeaturedEventsSection({ events, now, onOpen }: { events: CampusEvent[]; now: number; onOpen: (e: CampusEvent) => void }) {
  const [status, setStatus] = useState<StatusFilter>('all');
  if (!events.length) return null;
  const shown = filterEventsByStatus(events, status, now);
  const empty = eventsEmptyFor(events, status, now);
  return (
    <View style={{ marginBottom: 20 }}>
      <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '900', color: C.dark, marginBottom: 10 }}>Featured events</Text>
      <FilterChips label="Filter featured events by status" options={statusOptions(events, now)} value={status} onChange={(k) => setStatus(k ?? 'all')} />
      {empty && (
        <View accessibilityRole="summary" style={{ alignItems: 'center', padding: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: C.dark }}>{empty.title}</Text>
          <Text style={{ fontSize: 13, color: C.muted, marginTop: 4, textAlign: 'center' }}>{empty.body}</Text>
          {empty.canClear && (
            <TouchableOpacity onPress={() => setStatus('all')} accessibilityRole="button" accessibilityLabel="Show all featured events" style={{ minHeight: 44, justifyContent: 'center', marginTop: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: C.dark, textDecorationLine: 'underline' }}>Show all</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {shown.map((e) => (
        <TouchableOpacity
          key={e.id} activeOpacity={0.85} onPress={() => onOpen(e)} accessibilityRole="button"
          accessibilityLabel={`${e.title}, ${whenText(e)}`}
          style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 12, marginBottom: 14 }}>
          <SafeImage source={e.poster ?? e.image} ratio={4 / 5} icon="🎟️" label={`${e.title} poster`} radius={10} />
          <Text style={{ fontSize: 17, fontWeight: '900', color: C.dark, marginTop: 12 }}>{e.title}</Text>
          <Text style={{ fontSize: 13, color: C.muted, marginVertical: 4 }}>{whenText(e, true)}</Text>
          <Text style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{e.venue}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge event={e} now={now} />
            <View style={{ marginLeft: 8 }}><UnconfirmedLabel event={e} /></View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
