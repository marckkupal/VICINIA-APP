import { Text, TouchableOpacity, View } from 'react-native';
import type { CampusEvent } from '../data';
import { useEventList } from '../userEvents';
import { eventDate } from '../eventModel';
import { friendlyEventsError } from '../eventsApi';
import { startOfDay } from '../eventsView';
import { AnnouncementRow } from './OfficeKit';
import { EventSkeleton } from './EventSkeleton';
import { s } from '../styles';
import { C } from '../theme';

// Upcoming events organized by one office, straight from the events feed, with loading / error / empty states.
export function OfficeEvents({ host, limit, onPress }: { host: 'guidance' | 'osa'; limit?: number; onPress: (e: CampusEvent) => void }) {
  const feed = useEventList();
  const today = startOfDay(new Date());
  const all = feed.events.filter((e) => e.host === host && eventDate(e) >= today);
  const events = limit ? all.slice(0, limit) : all;
  const retry = (
    <TouchableOpacity onPress={feed.refresh} accessibilityRole="button" accessibilityLabel="Retry loading events" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 14, fontWeight: '900', color: C.green }}>Try again</Text>
    </TouchableOpacity>
  );
  if (feed.status === 'error' && feed.events.length === 0) {
    return <View style={{ marginBottom: 14 }}><Text style={[s.muted, { fontSize: 13 }]}>{friendlyEventsError(feed.error)}</Text>{retry}</View>;
  }
  if ((feed.status === 'idle' || feed.status === 'loading') && feed.events.length === 0) return <EventSkeleton featured={false} rows={2} />;
  return (
    <>
      {events.map((e) => <AnnouncementRow key={e.id} event={e} onPress={() => onPress(e)} />)}
      {events.length === 0 && <Text style={[s.muted, { fontSize: 13, marginBottom: 14 }]}>No upcoming events from the office yet.</Text>}
      {!!feed.error && feed.events.length > 0 && <View style={{ marginBottom: 8 }}><Text style={[s.muted, { fontSize: 12 }]}>Couldn’t refresh. Showing the last saved events.</Text>{retry}</View>}
    </>
  );
}
