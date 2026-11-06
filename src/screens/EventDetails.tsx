import { Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { LibPage } from '../components/LibPage';
import { OfficeIcon } from '../components/OfficeIcon';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { usePopup } from '../components/Popup';
import { feeLabel, kindLabel } from '../components/EventCard';
import type { CampusEvent } from '../data';
import { s } from '../styles';
import { eventLayout, TOUCH_MIN } from '../eventLayout';
import { C } from '../theme';

const GOING_AVATARS = [{ ini: 'MR', bg: '#F8E9E5' }, { ini: 'AS', bg: '#E3F0E4' }, { ini: 'LC', bg: '#EDE6F7' }];
const withCommas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const initialsOf = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function EventDetails({ event: e, onBack, onRegister, registered = false, onUnregister }: {
  event: CampusEvent; onBack: () => void; onRegister: () => void; registered?: boolean; onUnregister?: () => void;
}) {
  const paid = typeof e.fee === 'number' && e.fee > 0;
  const L = eventLayout(useWindowDimensions().width);
  const column = L.maxWidth ? { width: '100%' as const, maxWidth: L.maxWidth, alignSelf: 'center' as const } : undefined;
  const popup = usePopup();
  const timeRange = e.endTime ? `${e.time}–${e.endTime}` : e.time;
  const organizer = e.organizer ?? (e.host === 'guidance' ? 'Guidance Office' : undefined);
  const details = [
    { label: 'When', value: `${e.dateShort} · ${timeRange}` },
    { label: 'Where', value: e.venue },
    ...(feeLabel(e) ? [{ label: 'Fee', value: paid ? `${feeLabel(e)} · No payment collected` : feeLabel(e) }] : []),
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
  const share = () => Share.share({ message: `${e.title} · ${e.dateShort}, ${timeRange} at ${e.venue} on Vicinia` }).catch(() => {});
  const rows = [
    { key: 'when', icon: 'calendar' as const, bg: '#FDF1C4', title: e.dateLong, sub: timeRange },
    { key: 'where', icon: 'pin' as const, bg: '#E3F0E4', title: e.venue, sub: e.address ?? e.campus ?? '' },
  ];
  const photo = !!e.image;
  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ height: L.heroHeight, backgroundColor: e.bg, overflow: 'hidden', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
          {photo
            ? <Image source={e.image} resizeMode="cover" style={StyleSheet.absoluteFill} />
            : <Text style={{ position: 'absolute', alignSelf: 'center', top: 60, fontSize: 84 }}>{e.icon}</Text>}
          {photo && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.28)' }]} />}
          <View style={[{ flex: 1, justifyContent: 'flex-end' }, column]}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center' }}>
            <BackButton onPress={onBack} />
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={press} accessibilityRole="button" accessibilityLabel={registered ? 'Manage registration' : 'Register for this event'} style={{ width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: 15, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 24, color: C.yellow, marginTop: -2 }} importantForAccessibility="no">+</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={share} accessibilityRole="button" accessibilityLabel="Share event" style={{ width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
              <OfficeIcon name="share" size={20} />
            </TouchableOpacity>
          </View>
          <View style={{ alignSelf: 'flex-start', backgroundColor: C.dark, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 8 }}>
            <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13, fontWeight: '700', color: C.card }}>{registered ? 'Registered' : kindLabel(e)}</Text>
          </View>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={3} accessibilityRole="header" style={{ fontSize: L.heroTitle, fontWeight: '900', color: photo ? C.card : C.dark }}>{e.title}</Text>
          </View>
        </View>

        <View style={[{ padding: 16 }, column]}>
          {rows.map((r) => (
            <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: r.bg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <OfficeIcon name={r.icon} size={22} color={r.key === 'where' ? C.green : C.dark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.dark }}>{r.title}</Text>
                {!!r.sub && <Text style={{ fontSize: 14, color: C.muted, marginTop: 2 }}>{r.sub}</Text>}
              </View>
            </View>
          ))}

          <Text style={{ fontSize: 15, color: C.dark, lineHeight: 23, marginTop: 4, marginBottom: 18 }}>{e.about}</Text>

          {paid && (
            <View style={s.evFee}>
              <Text style={s.evFeeTitle}>{`Event fee · ${feeLabel(e)}`}</Text>
              <Text style={s.lbCardMeta}>Confirm participation details with the event organizer. This prototype does not collect payment.</Text>
            </View>
          )}

          {!!organizer && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 14, marginBottom: 18 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#E6E9F8', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: C.dark }}>{initialsOf(organizer)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: C.muted, letterSpacing: 0.4 }}>ORGANIZED BY</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: C.dark, marginTop: 2 }}>{organizer}</Text>
              </View>
              <OfficeIcon name="badgeCheck" size={26} color="#3D5FC4" />
            </View>
          )}

          {!!e.going && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
              <View style={{ flexDirection: 'row' }}>
                {GOING_AVATARS.map((a, i) => (
                  <View key={a.ini} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: a.bg, borderWidth: 2, borderColor: C.cream, alignItems: 'center', justifyContent: 'center', marginLeft: i === 0 ? 0 : -10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: C.dark }}>{a.ini}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ fontSize: 15, color: C.muted, marginLeft: 12 }}>{withCommas(e.going)} students are going</Text>
            </View>
          )}

          <PrivacyNote text="Demo registration only. No real registration or payment will be submitted." />
        </View>
      </ScrollView>

      <View style={[{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }, column]}>
        <TouchableOpacity onPress={press} activeOpacity={0.85} accessibilityRole="button" style={{ minHeight: 58, borderRadius: 18, backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {registered && <View style={{ marginRight: 10 }}><OfficeIcon name="checkCircle" size={22} color={C.yellow} /></View>}
          <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 17, fontWeight: '900', color: C.card }}>{registered ? 'You’re registered' : 'Register'}</Text>
        </TouchableOpacity>
      </View>
      {popup.node}
    </View>
  );
}

export function RegistrationPreview({ event: e, attendee, onBack, onReturn }: { event: CampusEvent; attendee: string; onBack: () => void; onReturn: () => void }) {
  const rows: [string, string][] = [
    ['EVENT', e.title],
    ['WHEN', `${e.dateShort} · ${e.time}`],
    ['WHERE', e.venue],
    ...(feeLabel(e) ? [['FEE', e.fee ? `${feeLabel(e)} · No payment collected` : feeLabel(e)] as [string, string]] : []),
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
