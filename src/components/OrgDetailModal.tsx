import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { OrgBoard } from '../content';
import { C } from '../theme';
import { eventsEmptyFor, filterEventsByStatus, statusOptions, type StatusFilter } from '../content/filters';
import { FilterChips } from './FilterChips';
import { StatusBadge, UnconfirmedLabel, whenText } from './EventBadges';
import { OrgDescription, TagRow } from './OrgBoardCard';
import { SafeImage } from './SafeImage';

// Detail view of one organization: the same identity block as the card, then every event it has, newest first.
export function OrgDetailModal({ org, now, onClose }: { org: OrgBoard | null; now: number; onClose: () => void }) {
  const [status, setStatus] = useState<StatusFilter>('all');
  useEffect(() => { setStatus('all'); }, [org?.id]);
  const all = org ? [...org.events].sort((a, b) => (b.startsAt ?? 0) - (a.startsAt ?? 0)) : [];
  const events = filterEventsByStatus(all, status, now);
  const empty = eventsEmptyFor(all, status, now);
  return (
    <Modal visible={!!org} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      {org && (
        <View style={{ flex: 1, backgroundColor: C.cream }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#fff' }}>
            <Text accessibilityRole="header" style={{ flex: 1, fontSize: 18, fontWeight: '900', color: C.dark }} numberOfLines={1}>{org.shortName}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22, color: C.dark }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 72 }}><SafeImage source={org.logo} lockRatio ratio={1} icon="🏛️" label={`${org.shortName} logo`} radius={36} /></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.dark }}>{org.name}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: C.muted, marginTop: 2 }}>{org.shortName} · {org.category}</Text>
              </View>
            </View>
            <OrgDescription org={org} />
            <TagRow tags={org.tags} />
            <Text accessibilityRole="header" style={{ fontSize: 16, fontWeight: '900', color: C.dark, marginTop: 18, marginBottom: 10 }}>Events ({all.length})</Text>
            {all.length > 0 && <FilterChips label="Filter events by status" options={statusOptions(all, now)} value={status} onChange={(k) => setStatus(k ?? 'all')} />}
            {empty && (
              <View accessibilityRole="summary">
                <Text style={{ fontSize: 13, color: C.muted }}>{empty.canClear ? `${empty.title}. ${empty.body}` : 'No events listed yet.'}</Text>
                {empty.canClear && (
                  <TouchableOpacity onPress={() => setStatus('all')} accessibilityRole="button" accessibilityLabel="Show all events" style={{ minHeight: 44, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: C.dark, textDecorationLine: 'underline' }}>Show all</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {events.map((e) => (
              <View key={e.id} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, marginBottom: 12 }}>
                <SafeImage source={e.poster} ratio={4 / 5} icon="🎟️" label={`${e.title} poster`} radius={8} />
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.dark, marginTop: 10 }}>{e.title}</Text>
                <Text style={{ fontSize: 12, color: C.muted, marginVertical: 4 }}>{whenText(e, true)}</Text>
                <Text style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{e.venue}</Text>
                <StatusBadge event={e} now={now} />
                <View style={{ marginTop: 4 }}><UnconfirmedLabel event={e} /></View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}
