import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import {
  AnnouncementRow, AppointmentSteps, ContactCard, InquiryForm, OfficeHero, OfficeInfoCard, RecentRequests, RequestSummary,
} from '../components/OfficeKit';
import { EVENTS, GUIDANCE } from '../data';
import { useOfficeRequests } from '../requests';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { campusLabel } from '../utils';

type V = { k: 'form' } | { k: 'done'; id: string };

// Guidance Office: its own page, opened from the Guidance tile on Home.
// Two tabs: Info (how to request an appointment) and Events (recent events organized by the office).
export function GuidanceScreen({ user, onBack, onOpenEvents }: { user: User; onBack: () => void; onOpenEvents: () => void }) {
  const [stack, setStack] = useState<V[]>([]);
  const { items, add, cancel } = useOfficeRequests(user, 'guidance');
  const view = stack[stack.length - 1];
  const push = (v: V) => setStack((st) => [...st, v]);
  const back = () => setStack((st) => st.slice(0, -1));
  const home = () => setStack([]);
  const campus = campusLabel(user.university);
  const finish = (r: Parameters<typeof add>[0]) => { add(r); setStack([{ k: 'done', id: r.id }]); };

  if (view?.k === 'form') {
    return <InquiryForm office={GUIDANCE} user={user} onBack={back} onSubmit={finish} />;
  }
  if (view?.k === 'done') {
    const req = items.find((r) => r.id === view.id);
    if (req) {
      return <RequestSummary req={req} office={GUIDANCE} campus={campus} onBack={home} onDone={home} onCancel={() => cancel(req.id)} />;
    }
  }

  // Three events organized by the office. Tapping any of them opens the Events page.
  const events = EVENTS.filter((e) => e.host === 'guidance').slice(0, 3);

  return (
    <View style={s.screen}>
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.libTitle}>{GUIDANCE.name}</Text>
          <Text style={s.libSub}>{GUIDANCE.tagline}</Text>
        </View>
      </View>

      <ScrollView style={s.fill} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <OfficeHero office={GUIDANCE} />
        <OfficeInfoCard office={GUIDANCE} />
        <AppointmentSteps title="How to request an appointment" steps={GUIDANCE.appointmentSteps ?? []} />

        <View style={[s.rowBetween, { marginTop: 8 }]}>
          <Text style={[s.sectionTitle, { fontSize: 20 }]}>Events</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }} onPress={onOpenEvents}>See all</Text>
        </View>
        {events.map((e) => <AnnouncementRow key={e.id} event={e} onPress={onOpenEvents} />)}
        {events.length === 0 && <Text style={[s.muted, { fontSize: 13, marginBottom: 14 }]}>No upcoming events from the office yet.</Text>}

        <ContactCard title="Contact the Office" sub="Send a private message to the Guidance Office" onPress={() => push({ k: 'form' })} />
        <RecentRequests items={items} onOpen={(id) => push({ k: 'done', id })} />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
