import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { OfficeIcon } from '../components/OfficeIcon';
import { usePopup } from '../components/Popup';
import {
  ContactCard, InquiryForm, OfficeHero, OfficeInfoCard, RecentRequests, RequestSummary, ServiceDetail, ServiceRow,
} from '../components/OfficeKit';
import { OSA } from '../data';
import { OfficeEvents } from '../components/OfficeEvents';
import { useOfficeRequests } from '../requests';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import type { OfficeIconName } from '../components/OfficeIcon';
import { campusLabel } from '../utils';

type V = { k: 'service'; key: string } | { k: 'form'; topic?: string } | { k: 'done'; id: string };

// Office of Student Affairs: its own page, opened from the OSA tile on Home.
export function OSAScreen({ user, onBack, onOpenEvent }: { user: User; onBack: () => void; onOpenEvent: (eventId: string) => void }) {
  const [stack, setStack] = useState<V[]>([]);
  const { items, add } = useOfficeRequests(user, 'osa');
  const popup = usePopup();
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

  const rows = OSA.services.filter((x) => x.key === 'orgs' || x.key === 'scholar');
  const tiles = OSA.services.filter((x) => x.key === 'events' || x.key === 'requests');

  const visitDesk = () => popup.show({
    iconName: 'pin', iconBg: '#E3F0E4',
    title: 'Visit the OSA help desk',
    body: 'Drop by during office hours for forms, permits and questions about student activities.',
    details: OSA.info.filter((i) => i.key !== 'contact').map((i) => ({ label: i.label.toLowerCase(), value: i.value })),
    actions: [
      { text: 'Send an inquiry instead', onPress: () => push({ k: 'form' }) },
      { text: 'Got it', style: 'secondary' },
    ],
  });
  const openContact = () => popup.show({
    iconName: 'message', iconBg: '#E6EDFB',
    title: 'Contact Student Affairs',
    body: 'How would you like to reach the office?',
    actions: [
      { text: 'Send an inquiry', onPress: () => push({ k: 'form' }) },
      { text: 'Visit the help desk', style: 'secondary', onPress: visitDesk },
      { text: 'Cancel', style: 'secondary' },
    ],
  });

  return (
    <View style={s.screen}>
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.libTitle}>{OSA.short}</Text>
          <Text style={s.libSub}>{OSA.tagline}</Text>
        </View>
      </View>
      <ScrollView style={s.fill} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <OfficeHero office={OSA} />
        <OfficeInfoCard office={OSA} />

        <View style={s.rowBetween}>
          <Text style={[s.sectionTitle, { fontSize: 20 }]}>Student services</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }}>How can we help?</Text>
        </View>
        {rows.map((svc) => <ServiceRow key={svc.key} svc={svc} onPress={() => push({ k: 'service', key: svc.key })} />)}
        <View style={[s.rowCenter, { marginBottom: 16 }]}>
          {tiles.map((svc, idx) => (
            <TouchableOpacity
              key={svc.key}
              style={[s.osaTile, idx < tiles.length - 1 && { marginRight: 10 }]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${svc.title}: ${svc.sub}`}
              onPress={() => push({ k: 'service', key: svc.key })}
            >
              <View style={{ marginRight: 10 }}><OfficeIcon name={svc.icon as OfficeIconName} size={20} color={C.green} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.osaTileTitle} numberOfLines={1}>{svc.title}</Text>
                <Text style={s.osaTileSub} numberOfLines={1}>{svc.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.rowBetween, { marginTop: 8 }]}>
          <Text style={[s.sectionTitle, { fontSize: 20 }]}>Announcements</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.muted }}>Upcoming</Text>
        </View>
        <OfficeEvents host="osa" onPress={(e) => onOpenEvent(e.id)} />

        <ContactCard title="Contact Student Affairs" sub="Send an inquiry or visit the OSA help desk" onPress={openContact} />

        <RecentRequests items={items} onOpen={(id) => push({ k: 'done', id })} />
        {popup.node}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
