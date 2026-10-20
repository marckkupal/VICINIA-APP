import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import {
  AnnouncementRow, ContactCard, InquiryForm, OfficeHero, OfficeInfoCard, RecentRequests, RequestSummary, ServiceDetail, ServiceRow,
} from '../components/OfficeKit';
import { EVENTS, OSA } from '../data';
import { useOfficeRequests } from '../requests';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { campusLabel } from '../utils';

type V = { k: 'service'; key: string } | { k: 'form'; topic?: string } | { k: 'done'; id: string };

// Office of Student Affairs: its own page, opened from the OSA tile on Home.
export function OSAScreen({ user, onBack, onOpenEvent }: { user: User; onBack: () => void; onOpenEvent: (eventId: string) => void }) {
  const [stack, setStack] = useState<V[]>([]);
  const { items, add } = useOfficeRequests(user, 'osa');
  const view = stack[stack.length - 1];
  const push = (v: V) => setStack((st) => [...st, v]);
  const back = () => setStack((st) => st.slice(0, -1));
  const home = () => setStack([]);
  const campus = campusLabel(user.university);

  if (view?.k === 'service') {
    const svc = OSA.services.find((x) => x.key === view.key);
    if (svc) {
      return (
        <ServiceDetail
          office={OSA} svc={svc} onBack={back}
          onStart={() => (svc.action === 'event' && svc.eventId ? onOpenEvent(svc.eventId) : push({ k: 'form', topic: svc.topic }))}
        />
      );
    }
  }
  if (view?.k === 'form') {
    return (
      <InquiryForm
        office={OSA} user={user} initialTopic={view.topic} onBack={back}
        onSubmit={(r) => { add(r); setStack([{ k: 'done', id: r.id }]); }}
      />
    );
  }
  if (view?.k === 'done') {
    const req = items.find((r) => r.id === view.id);
    if (req) return <RequestSummary req={req} office={OSA} campus={campus} onBack={home} onDone={home} />;
  }

  const announcements = EVENTS.filter((e) => OSA.announcementIds.includes(e.id));

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.libTitle}>OSA</Text>
          <Text style={s.libSub}>Office of Student Affairs</Text>
        </View>
        <Text style={{ fontSize: 22, marginLeft: 12 }}>🎓</Text>
      </View>

      <OfficeHero office={OSA} />
      <OfficeInfoCard office={OSA} />

      <View style={s.rowBetween}>
        <Text style={[s.sectionTitle, { fontSize: 20 }]}>Student services</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }}>{OSA.services.length} services</Text>
      </View>
      {OSA.services.map((svc) => <ServiceRow key={svc.key} svc={svc} onPress={() => push({ k: 'service', key: svc.key })} />)}

      <View style={[s.rowBetween, { marginTop: 8 }]}>
        <Text style={[s.sectionTitle, { fontSize: 20 }]}>Announcements</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.muted }}>Upcoming</Text>
      </View>
      {announcements.map((e) => <AnnouncementRow key={e.id} event={e} onPress={() => onOpenEvent(e.id)} />)}
      {announcements.length === 0 && <Text style={[s.muted, { fontSize: 13, marginBottom: 14 }]}>No announcements right now. Check back soon.</Text>}

      <ContactCard title="Contact the office" sub="Send an inquiry to Student Affairs" onPress={() => push({ k: 'form' })} />

      <RecentRequests items={items} onOpen={(id) => push({ k: 'done', id })} />
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
