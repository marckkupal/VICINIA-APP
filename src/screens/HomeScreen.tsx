import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Avatar } from '../components/Avatar';
import { LogoMark } from '../components/LogoMark';
import { PostCard } from '../components/PostCard';
import { SearchBar } from '../components/SearchBar';
import { POSTS, QUICK } from '../data';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { ClinicScreen } from './ClinicScreen';
import { LibraryScreen } from './LibraryScreen';

export function HomeScreen({ user, goProfile }: { user: User; goProfile: () => void }) {
  const [page, setPage] = useState<'home' | 'library' | 'clinic'>('home');
  if (page === 'library') return <LibraryScreen onBack={() => setPage('home')} />;
  if (page === 'clinic') return <ClinicScreen onBack={() => setPage('home')} />;
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.homeHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <LogoMark size={42} />
          <Text style={s.homeTitle}>  VICINIA</Text>
        </View>
        <View style={s.bellBtn}><Text>🔔</Text><View style={s.redDot} /></View>
        <TouchableOpacity onPress={goProfile} style={{ marginHorizontal: 10 }}><Avatar user={user} size={40} /></TouchableOpacity>
        <TouchableOpacity style={s.plusBtn}><Text style={{ fontWeight: '900', fontSize: 18, color: C.dark }}>+</Text></TouchableOpacity>
      </View>

      <SearchBar filter />

      <View style={s.quickRow}>
        {QUICK.map((q) => (
          <TouchableOpacity
            key={q.label}
            style={[s.quickTile, { backgroundColor: q.bg, borderColor: q.border }]}
            onPress={q.label === 'Library' ? () => setPage('library') : q.label === 'Clinic' ? () => setPage('clinic') : undefined}
          >
            <Text style={{ fontSize: 20 }}>{q.icon}</Text>
            <Text style={s.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.rowBetween}>
        <View>
          <Text style={s.sectionTitle}>For you</Text>
          <Text style={s.sectionSub}>Community picks</Text>
        </View>
        <TouchableOpacity><Text style={s.seeAll}>See all</Text></TouchableOpacity>
      </View>

      {POSTS.map((p) => <PostCard key={p.id} p={p} />)}
      <View style={{ height: 12 }} />
    </ScrollView>
  );
}
