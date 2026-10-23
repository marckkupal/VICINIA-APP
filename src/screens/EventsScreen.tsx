import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { EVENTS } from '../data';
import type { CampusEvent } from '../data';
import { s } from '../styles';
import type { User } from '../types';
import { C } from '../theme';
import { EventDetails, RegistrationPreview } from './EventDetails';
import { registerEvent, unregisterEvent, useMembership } from '../membership';
import { PostSection } from '../components/PostSection';
import { BackButton } from '../components/BackButton';

// host: show only events organized by one office (e.g. Guidance). onBack adds a back button.
export function EventsScreen({ user, embedded, host, title, onBack }: { user?: User | null; embedded?: boolean; host?: 'guidance'; title?: string; onBack?: () => void }) {
  const [view, setView] = useState<'list' | 'details' | 'registered'>('list');
  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [posting, setPosting] = useState(false);
  const mem = useMembership(user?.email);
  const events = embedded ? EVENTS.filter((e) => mem.events.includes(e.id)) : host ? EVENTS.filter((e) => e.host === host) : EVENTS;

  if (event && view === 'details') {
    return (
      <EventDetails
        event={event} onBack={() => setView('list')}
        registered={mem.events.includes(event.id)}
        onUnregister={() => unregisterEvent(user?.email, event.id)}
        onRegister={() => { registerEvent(user?.email, event.id); setView('registered'); }}
      />
    );
  }
  if (event && view === 'registered') {
    return <RegistrationPreview event={event} attendee={user?.name ?? 'Student'} onBack={() => setView('details')} onReturn={() => setView('list')} />;
  }

  const header = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {!!onBack && <View style={{ marginRight: 12 }}><BackButton onPress={onBack} /></View>}
        <Text style={[s.header, { flex: 1, marginBottom: 0 }]}>{title ?? 'Events'}</Text>
        {!embedded && !host && (
          <TouchableOpacity style={s.libAddBtn} onPress={() => setPosting(true)} accessibilityLabel="New post">
            <Text style={{ fontWeight: '900', fontSize: 22, color: C.dark, marginTop: -1 }}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
  const body = (
    <>
        {events.map((e) => (
          <TouchableOpacity key={e.id} style={[s.card, s.rowCenter]} activeOpacity={0.8} onPress={() => { setEvent(e); setView('details'); }}>
            <View style={s.dateBox}><Text style={s.dateText}>{`${e.mon}\n${e.day}`}</Text></View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={s.postName}>{e.title}</Text>
              <Text style={s.muted}>{e.venue} • {e.time}</Text>
            </View>
            <Text style={s.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
        {host && events.length === 0 && <Text style={[s.muted, { textAlign: 'center', marginTop: 24 }]}>No upcoming events from the office yet.</Text>}
        {embedded && events.length === 0 && <Text style={[s.muted, { textAlign: 'center', marginTop: 24 }]}>You haven’t registered for any events yet.</Text>}
        {!embedded && !host && <PostSection page="events" user={user} tags={['Event', 'Meetup', 'Looking for group']} placeholder="Post about an event…" open={posting} onClose={() => setPosting(false)} />}
        <View style={{ height: 24 }} />
    </>
  );
  // Embedded inside another scrolling page (e.g. LibPage) keep one scroll view; otherwise pin the header.
  if (embedded) {
    return (
      <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
        {header}
        {body}
      </ScrollView>
    );
  }
  return (
    <View style={s.screen}>
      {header}
      <ScrollView style={s.fill} showsVerticalScrollIndicator={false}>
        {body}
      </ScrollView>
    </View>
  );
}
