import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { BackButton } from '../components/BackButton';
import { useToast } from '../components/Toast';
import { usePopup } from '../components/Popup';
import { OfficeIcon } from '../components/OfficeIcon';
import type { OfficeIconName } from '../components/OfficeIcon';
import { LIBRARY } from '../data';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { campusLabel } from '../utils';
import { LibraryBooking, BookingSummary } from './LibraryBooking';
import type { Booking } from './LibraryBooking';

type View_ = 'home' | 'booking' | 'summary';

export function LibraryScreen({ onBack, user }: { onBack: () => void; user?: User }) {
  const [view, setView] = useState<View_>('home');
  const [booking, setBooking] = useState<Booking | null>(null);

  const campus = user ? campusLabel(user.university) : 'TIP Quezon City';
  const student = user ? `${user.name} · ${campus}` : 'Student';

  const toast = useToast();
  const popup = usePopup();

  if (view === 'booking') {
    return <LibraryBooking onBack={() => setView('home')} onConfirm={(b) => { setBooking(b); setView('summary'); }} />;
  }
  if (view === 'summary' && booking) {
    return <BookingSummary booking={booking} student={student} onBack={() => setView('booking')} onDone={() => setView('home')} />;
  }

  const emailUnavailable = () => popup.show({
    iconName: 'mail', iconBg: '#E6EDFB',
    title: 'Email unavailable',
    body: 'No mail app was found on this device. You can write to the library desk directly.',
    details: [{ label: 'Library desk', value: LIBRARY.email }],
    actions: [{ text: 'OK' }],
  });
  const email = (subject: string) => Linking.openURL(`mailto:${LIBRARY.email}?subject=${encodeURIComponent(subject)}`).catch(emailUnavailable);

  const hours = LIBRARY.info.find((i) => i.key === 'hours')?.value ?? '';
  const spaces = () => popup.show({
    iconName: 'armchair', iconBg: '#E3F0E4',
    title: 'Study spaces',
    body: 'Pick the zone that fits how you study. Group rooms can be booked in the app; the other zones are first come, first served.',
    details: [
      { label: 'Quiet zone', value: 'Silent individual study' },
      { label: 'Group zone', value: 'Discussion-friendly tables and bookable rooms' },
      { label: 'Computer zone', value: 'Workstations and printing' },
      { label: 'Reading zone', value: 'Print collection and journals' },
    ],
    actions: [
      { text: 'Book a study room', onPress: () => setView('booking') },
      { text: 'Close', style: 'secondary' },
    ],
  });

  const openPlan = (key: string, title: string) => {
    if (key === 'book') return setView('booking');
    if (key === 'spaces') return spaces();
    email(title);
  };

  const askLibrarian = () => popup.show({
    iconName: 'message', iconBg: '#FDF1C4',
    title: 'Ask a librarian',
    body: 'Email your research question and the library desk will reply. For quick questions, drop by the desk.',
    details: [{ label: 'Desk hours', value: hours }, { label: 'Email', value: LIBRARY.email }],
    actions: [
      { text: 'Email the desk', onPress: () => email('Research question') },
      { text: 'Not now', style: 'secondary' },
    ],
  });

  return (
    <View style={s.screen}>
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.libTitle}>Library</Text>
          <Text style={s.libSub}>Resources for study and discovery</Text>
        </View>
      </View>
      <ScrollView style={s.fill} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.libHero}>
          <View style={s.libHeroIcon}><OfficeIcon name="library" size={34} color={C.yellow} strokeWidth={1.6} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.libHeroTitle}>{LIBRARY.name}</Text>
            <Text style={s.libHeroBody}>{LIBRARY.blurb}</Text>
          </View>
        </View>

        <View style={s.libInfoCard}>
          {LIBRARY.info.map((i, idx) => (
            <View key={i.key} style={[s.rowCenter, idx < LIBRARY.info.length - 1 && { marginBottom: 10 }]}>
              <View style={[s.libInfoIcon, { backgroundColor: i.bg }]}><OfficeIcon name={i.icon as OfficeIconName} size={18} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.libInfoLabel}>{i.label}</Text>
                <Text style={s.libInfoValue}>{i.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.rowBetween}>
          <Text style={[s.sectionTitle, { fontSize: 20 }]}>Plan your study</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }}>Spaces available</Text>
        </View>

        {LIBRARY.plan.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={s.libPlanRow}
            activeOpacity={0.7}
            onPress={() => openPlan(p.key, p.title)}
          >
            <View style={[s.libPlanIcon, { backgroundColor: p.bg }]}><OfficeIcon name={p.icon as OfficeIconName} size={24} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.postName}>{p.title}</Text>
              <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>{p.sub}</Text>
            </View>
            <OfficeIcon name="chevronRight" size={20} color={C.muted} />
          </TouchableOpacity>
        ))}

        {toast.node}
        {popup.node}

        <TouchableOpacity style={s.libAsk} activeOpacity={0.8} onPress={askLibrarian}>
          <View style={{ marginRight: 12 }}><OfficeIcon name="message" size={24} color={C.yellow} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.libAskTitle}>Ask a librarian</Text>
            <Text style={s.libAskSub}>Chat with the desk or email your research question</Text>
          </View>
          <OfficeIcon name="arrowUpRight" size={20} color={C.yellow} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
