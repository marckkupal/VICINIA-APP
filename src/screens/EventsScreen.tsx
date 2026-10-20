import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { EVENTS } from '../data';
import type { CampusEvent } from '../data';
import { s } from '../styles';
import type { User } from '../types';
import { EventDetails, RegistrationPreview } from './EventDetails';

export function EventsScreen({ user }: { user?: User | null }) {
  const [view, setView] = useState<'list' | 'details' | 'registered'>('list');
  const [event, setEvent] = useState<CampusEvent | null>(null);

  if (event && view === 'details') {
    return <EventDetails event={event} onBack={() => setView('list')} onRegister={() => setView('registered')} />;
  }
  if (event && view === 'registered') {
    return <RegistrationPreview event={event} attendee={user?.name ?? 'Student'} onBack={() => setView('details')} onReturn={() => setView('list')} />;
  }

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <Text style={s.header}>Events</Text>
      {EVENTS.map((e) => (
        <TouchableOpacity key={e.id} style={[s.card, s.rowCenter]} activeOpacity={0.8} onPress={() => { setEvent(e); setView('details'); }}>
          <View style={s.dateBox}><Text style={s.dateText}>{`${e.mon}\n${e.day}`}</Text></View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={s.postName}>{e.title}</Text>
            <Text style={s.muted}>{e.venue} • {e.time}</Text>
          </View>
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
