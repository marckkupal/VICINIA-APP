import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LibPage } from '../components/LibPage';
import { PLACES } from '../data';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { campusLabel } from '../utils';
import { useMembership } from '../membership';

type Filter = 'all' | 'study' | 'food';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All saved' },
  { key: 'study', label: 'Study' },
  { key: 'food', label: 'Food' },
];

export function SavedPlaces({ user, onBack, onExplore }: { user: User; onBack: () => void; onExplore: () => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const mem = useMembership(user.email);
  const shown = PLACES.filter((p) => mem.places.includes(p.id)).filter((p) => filter === 'all' || p.kind === filter);
  const first = user.name.trim().split(/\s+/)[0] || 'Your';

  return (
    <LibPage
      title="Saved places"
      sub={`${first}’s campus collection`}
      onBack={onBack}
      footer={
        <TouchableOpacity style={s.secondaryBtn} onPress={onExplore} activeOpacity={0.8}>
          <Text style={s.secondaryBtnText}>Explore more places</Text>
        </TouchableOpacity>
      }
    >
      <View style={s.lbChipRow}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <TouchableOpacity key={f.key} style={[s.lbChip, on && s.lbChipOn]} onPress={() => setFilter(f.key)}>
              <Text style={[s.lbChipText, on && s.lbChipTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[s.muted, { fontSize: 12, marginBottom: 12 }]}>Saved to {user.name} · {campusLabel(user.university)}</Text>

      {shown.length === 0 && (
        <Text style={[s.muted, { fontSize: 13, marginBottom: 14 }]}>No saved places yet. Tap the bookmark on a place to save it.</Text>
      )}
      {shown.map((p) => (
        <View key={p.id} style={[s.lbCard, { marginBottom: 14 }]}>
          <View style={[s.lbCardIcon, { backgroundColor: '#FDF1C4' }]}><Text style={{ fontSize: 22 }}>{p.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.lbCardTitle}>{p.name}</Text>
            <Text style={s.lbCardMeta}>{p.type}{p.price ? ` · ${p.price}` : ''} · {p.distance}</Text>
            <Text style={[s.lbCardMeta, { color: C.green, fontWeight: '800', marginTop: 2 }]}>{p.status}</Text>
          </View>
          <Text style={{ fontSize: 16 }}>🔖</Text>
        </View>
      ))}

      <View style={s.evFee}>
        <Text style={s.evFeeTitle}>Your next study spot, kept close.</Text>
        <Text style={s.lbCardMeta}>Use the bookmark on a place to keep it in your personal collection.</Text>
      </View>

    </LibPage>
  );
}
