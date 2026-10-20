import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LibPage } from '../components/LibPage';
import type { Person } from '../people';
import { s } from '../styles';
import { C } from '../theme';
import { initials } from '../utils';

export function MemberProfile({ person, onBack, onMessage }: { person: Person; onBack: () => void; onMessage: () => void }) {
  const [following, setFollowing] = useState(false);
  const stats = [
    { n: person.boards, label: 'Boards' },
    { n: person.events, label: 'Events' },
    { n: person.posts, label: 'Posts' },
  ];
  return (
    <LibPage
      title="Profile"
      sub={person.campus}
      onBack={onBack}
      footer={
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={[s.profileBtn, { backgroundColor: C.dark, marginRight: 10 }]} onPress={onMessage} activeOpacity={0.85}>
            <Text style={{ color: C.yellow, marginRight: 8 }}>💬</Text>
            <Text style={[s.profileBtnText, { color: '#fff' }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.profileBtn, following ? { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border } : { backgroundColor: C.yellow }]}
            onPress={() => setFollowing((f) => !f)}
            activeOpacity={0.85}
          >
            <Text style={s.profileBtnText}>{following ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={[s.darkCard, { padding: 16, borderRadius: 20 }]}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: person.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: C.dark }}>{initials(person.name)}</Text>
        </View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={[s.darkName, { fontSize: 20 }]}>{person.name}</Text>
          <Text style={s.profileSub}>{person.program} · {person.year}</Text>
          <Text style={s.profileLoc}>📍 {person.campus}</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        {stats.map((st, i) => (
          <View key={st.label} style={[s.statCard, i < stats.length - 1 && { marginRight: 10 }]}>
            <Text style={s.statNum}>{st.n}</Text>
            <Text style={s.muted}>{st.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.lbInfoCard}>
        <Text style={s.lbLabel}>ABOUT</Text>
        <Text style={[s.lbBody, { marginBottom: 14 }]}>{person.bio}</Text>
        <Text style={s.lbLabel}>INTERESTS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {person.interests.map((i) => (
            <View key={i} style={[s.lbChip, { marginBottom: 8 }]}><Text style={s.lbChipText}>{i}</Text></View>
          ))}
        </View>
      </View>

      <View style={s.verified}>
        <Text style={{ color: C.green, marginRight: 10, fontSize: 16 }}>✔️</Text>
        <Text style={s.verifiedText}>Verified TIP student</Text>
      </View>
      <Text style={[s.muted, { marginTop: 12 }]}>Sample profile for the demo. Follow and message actions aren’t sent anywhere.</Text>
    </LibPage>
  );
}
