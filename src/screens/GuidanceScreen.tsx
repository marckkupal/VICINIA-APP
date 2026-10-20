import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import {
  AnnouncementRow, AppointmentForm, ContactCard, EmergencyCard, InquiryForm, OfficeHero, OfficeInfoCard, RecentRequests,
  RequestSummary, ServiceDetail, ServiceRow,
} from '../components/OfficeKit';
import { EVENTS, GUIDANCE } from '../data';
import type { OfficeService } from '../data';
import { useOfficeRequests } from '../requests';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { campusLabel } from '../utils';

type V = { k: 'service'; key: string } | { k: 'form'; topic?: string } | { k: 'appt' } | { k: 'done'; id: string };

// Guidance Office: its own page, opened from the Guidance tile on Home.
export function GuidanceScreen({ user, onBack, onOpenEvent }: { user: User; onBack: () => void; onOpenEvent: (eventId: string) => void }) {
  const [stack, setStack] = useState<V[]>([]);
  const { items, add, cancel } = useOfficeRequests(user, 'guidance');
  const view = stack[stack.length - 1];
  const push = (v: V) => setStack((st) => [...st, v]);
  const back = () => setStack((st) => st.slice(0, -1));
  const home = () => setStack([]);
  const campus = campusLabel(user.university);
  const finish = (r: Parameters<typeof add>[0]) => { add(r); setStack([{ k: 'done', id: r.id }]); };

  const start = (svc: OfficeService) => {
    if (svc.action === 'event' && svc.eventId) return onOpenEvent(svc.eventId);
    if (svc.action === 'appointment') return push({ k: 'appt' });
    push({ k: 'form', topic: svc.topic });
  };
  const eventOf = (svc: OfficeService) => (svc.eventId ? EVENTS.find((e) => e.id === svc.eventId) : undefined);

  if (view?.k === 'service') {
    const svc = GUIDANCE.services.find((x) => x.key === view.key);
    if (svc) return <ServiceDetail office={GUIDANCE} svc={svc} onBack={back} onStart={() => start(svc)} />;
  }
  if (view?.k === 'appt') {
    return <AppointmentForm office={GUIDANCE} user={user} existing={items} onBack={back} onSubmit={finish} />;
  }
  if (view?.k === 'form') {
    return <InquiryForm office={GUIDANCE} user={user} initialTopic={view.topic} onBack={back} onSubmit={finish} />;
  }
  if (view?.k === 'done') {
    const req = items.find((r) => r.id === view.id);
    if (req) {
      return <RequestSummary req={req} office={GUIDANCE} campus={campus} onBack={home} onDone={home} onCancel={() => cancel(req.id)} />;
    }
  }

  const announcements = EVENTS.filter((e) => GUIDANCE.announcementIds.includes(e.id));

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.libTitle}>Guidance</Text>
          <Text style={s.libSub}>Support, appointments and wellbeing</Text>
        </View>
        <Text style={{ fontSize: 22, marginLeft: 12 }}>💛</Text>
      </View>

      <OfficeHero office={GUIDANCE} />
      <OfficeInfoCard office={GUIDANCE} />
      <EmergencyCard sub="For non-emergency concerns, use the options below." />

      <View style={s.rowBetween}>
        <Text style={[s.sectionTitle, { fontSize: 20 }]}>Guidance services</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }}>Private & caring</Text>
      </View>
      {GUIDANCE.services.map((svc) => {
        const e = eventOf(svc);
        return (
          <ServiceRow
            key={svc.key} svc={svc} sub={e ? `${e.dateShort} · ${e.time} · ${e.venue}` : undefined}
            onPress={() => push({ k: 'service', key: svc.key })}
          />
        );
      })}

      <View style={[s.rowBetween, { marginTop: 8 }]}>
        <Text style={[s.sectionTitle, { fontSize: 20 }]}>Announcements</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.muted }}>Upcoming</Text>
      </View>
      {announcements.map((e) => <AnnouncementRow key={e.id} event={e} onPress={() => onOpenEvent(e.id)} />)}
      {announcements.length === 0 && <Text style={[s.muted, { fontSize: 13, marginBottom: 14 }]}>No announcements right now. Check back soon.</Text>}

      <ContactCard title="Contact the office" sub="Send a private inquiry to the Guidance Office" onPress={() => push({ k: 'form' })} />

      <RecentRequests items={items} onOpen={(id) => push({ k: 'done', id })} />
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
