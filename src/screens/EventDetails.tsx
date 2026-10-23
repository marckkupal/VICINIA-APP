import { Text, View } from 'react-native';
import { LibPage } from '../components/LibPage';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { usePopup } from '../components/Popup';
import type { CampusEvent } from '../data';
import { s } from '../styles';

export function EventDetails({ event: e, onBack, onRegister, registered = false, onUnregister }: {
  event: CampusEvent; onBack: () => void; onRegister: () => void; registered?: boolean; onUnregister?: () => void;
}) {
  const free = e.fee === 0;
  const popup = usePopup();
  const details = [
    { label: 'When', value: `${e.dateShort} · ${e.time}` },
    { label: 'Where', value: e.venue },
    { label: 'Fee', value: free ? 'Free' : `₱${e.fee} · No payment collected` },
  ];
  const press = () => {
    if (registered) {
      return popup.show({
        icon: '✅', iconBg: '#EAF3EC',
        title: 'You’re registered',
        body: 'You are on the demo list for this event. Need to change plans?',
        details,
        actions: [
          { text: 'Keep registration', style: 'secondary' },
          { text: 'Cancel registration', style: 'danger', onPress: () => onUnregister?.() },
        ],
      });
    }
    popup.show({
      icon: e.icon, iconBg: e.bg,
      title: `Register for ${e.title}?`,
      body: 'Demo only. No real registration or payment will be submitted.',
      details,
      actions: [
        { text: 'Not yet', style: 'secondary' },
        { text: 'Register', onPress: onRegister },
      ],
    });
  };
  const rows = [
    { icon: '🗓️', bg: '#FDF1C4', title: e.dateLong, sub: e.time },
    { icon: '📍', bg: '#E3F0E4', title: e.venue, sub: e.campus },
  ];
  return (
    <LibPage title="Event details" sub="Campus events" onBack={onBack} footer={<PrimaryButton label={registered ? '✓  You’re registered' : 'Register · Demo'} onPress={press} />}>
      <View style={[s.evHero, { backgroundColor: e.bg }]}>
        <Text style={s.evKicker}>{e.kind} · {free ? 'FREE' : `₱${e.fee}`}</Text>
        <View style={s.evHeroRow}>
          <Text style={s.evHeroTitle}>{e.title}</Text>
          <Text style={{ fontSize: 38, marginLeft: 8 }}>{e.icon}</Text>
        </View>
      </View>

      {rows.map((r) => (
        <View key={r.icon} style={s.evRow}>
          <View style={[s.lbCardIcon, { backgroundColor: r.bg }]}><Text style={{ fontSize: 18 }}>{r.icon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.lbCardTitle}>{r.title}</Text>
            <Text style={s.lbCardMeta}>{r.sub}</Text>
          </View>
          <Text style={s.menuChevron}>›</Text>
        </View>
      ))}

      <Text style={[s.lbBody, { marginTop: 4 }]}>{e.about}</Text>

      <View style={s.evFee}>
        <Text style={s.evFeeTitle}>{free ? 'Free campus event' : `Workshop fee · ₱${e.fee}`}</Text>
        <Text style={s.lbCardMeta}>Confirm participation details with the event organizer. This prototype does not collect payment.</Text>
      </View>

      <PrivacyNote text="Demo registration only. No real registration or payment will be submitted." />
      {popup.node}
    </LibPage>
  );
}

export function RegistrationPreview({ event: e, attendee, onBack, onReturn }: { event: CampusEvent; attendee: string; onBack: () => void; onReturn: () => void }) {
  const rows: [string, string][] = [
    ['EVENT', e.title],
    ['WHEN', `${e.dateShort} · ${e.time}`],
    ['WHERE', e.venue],
    ['FEE', e.fee === 0 ? 'Free' : `₱${e.fee} · No payment collected`],
    ['ATTENDEE', attendee],
  ];
  return (
    <LibPage
      title="Registration preview"
      sub="Campus events"
      onBack={onReturn}
      footer={
        <>
          <PrimaryButton label="Return to event" onPress={onBack} />
          <Text onPress={onReturn} style={[s.linkBtnText, { textAlign: 'center', marginTop: 14 }]}>Back to campus events</Text>
        </>
      }
    >
      <View style={s.lbSuccessWrap}>
        <View style={s.lbSuccessCircle}><Text style={{ fontSize: 34, color: '#3C9A5F' }}>✓</Text></View>
        <Text style={s.lbSuccessTitle}>You’re on the demo list.</Text>
      </View>
      <Text style={s.lbSuccessSub}>A simulated registration for {e.title}.</Text>
      <View style={s.lbSummaryCard}>
        {rows.map(([label, value], i) => (
          <View key={label}>
            <Text style={s.lbLabel}>{label}</Text>
            <Text style={[s.lbValue, i === rows.length - 1 && { marginBottom: 0 }]}>{value}</Text>
          </View>
        ))}
      </View>
      <PrivacyNote text="Demo only. No real registration or payment was submitted. This is not an admission ticket." />
    </LibPage>
  );
}
