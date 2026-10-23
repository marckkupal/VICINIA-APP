import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { BackButton } from '../components/BackButton';
import { CLINIC } from '../data';
import { s } from '../styles';
import { C } from '../theme';
import { useToast } from '../components/Toast';
import { usePopup } from '../components/Popup';
import { OfficeIcon } from '../components/OfficeIcon';
import type { OfficeIconName } from '../components/OfficeIcon';

export function ClinicScreen({ onBack }: { onBack: () => void }) {
  const toast = useToast();
  const popup = usePopup();
  const hours = CLINIC.info.find((i) => i.key === 'hours')?.value ?? '';
  const where = CLINIC.info.find((i) => i.key === 'location')?.value ?? '';
  const callClinic = () => Linking.openURL(`tel:${CLINIC.phone}`).catch(() => toast.show('Unable to place the call.'));

  const request = () => popup.show({
    iconName: 'calendarCheck', iconBg: '#F8E6E1',
    title: 'Request an appointment',
    body: 'Appointments are confirmed by the clinic. Call to pick an available time, or just walk in during clinic hours.',
    details: [{ label: 'Clinic hours', value: hours }, { label: 'Phone', value: '(02) 8911 0964 · local 126' }],
    actions: [
      { text: 'Not now', style: 'secondary' },
      { text: 'Call clinic', onPress: callClinic },
    ],
  });

  const SERVICE_INFO: Record<string, { body: string; bg: string }> = {
    consult: { body: 'See the campus nurse or physician for a health assessment and basic medical care.', bg: '#F8E6E1' },
    firstaid: { body: 'Minor cuts, sprains, burns and other on-campus first aid. For serious injuries, call 911 first.', bg: '#FDF1C4' },
    certs: { body: 'Request medical certificates for absences or activities. Bring your student ID.', bg: '#E6EDFB' },
  };
  const service = (key: string, label: string, iconName: OfficeIconName) => popup.show({
    iconName, iconBg: SERVICE_INFO[key]?.bg,
    title: label,
    body: SERVICE_INFO[key]?.body ?? 'Walk-ins are welcome during clinic hours.',
    details: [{ label: 'Walk-ins welcome', value: hours }, { label: 'Where', value: where }],
    actions: [
      { text: 'Close', style: 'secondary' },
      { text: 'Call clinic', onPress: callClinic },
    ],
  });

  // Confirm before dialing so an accidental tap never places an emergency call.
  const call911 = () => popup.show({
    iconName: 'siren', iconBg: C.errorBg,
    title: 'Call 911?',
    body: `This opens your phone’s dialer. ${CLINIC.emergencyNote}`,
    actions: [
      { text: 'Cancel', style: 'secondary' },
      {
        text: 'Call 911', style: 'dark',
        onPress: () => Linking.openURL('tel:911').catch(() => popup.show({
          icon: '⚠️', iconBg: C.errorBg, title: 'Unable to call', body: 'Please dial 911 directly from your phone.',
          actions: [{ text: 'OK' }],
        })),
      },
    ],
  });

  return (
    <View style={s.screen}>
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.libTitle}>Clinic</Text>
          <Text style={s.libSub}>University Health Service</Text>
        </View>
      </View>
      <ScrollView style={s.fill} showsVerticalScrollIndicator={false}>
        <View style={s.clinicHero}>
          <View style={s.clinicHeroIcon}><OfficeIcon name="crossOutline" size={34} color={C.yellow} strokeWidth={1.7} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.libHeroTitle}>{CLINIC.name}</Text>
            <Text style={s.libHeroBody}>{CLINIC.blurb}</Text>
          </View>
        </View>

        <View style={s.libInfoCard}>
          {CLINIC.info.map((i, idx) => {
            const row = (
              <View style={[s.rowCenter, idx < CLINIC.info.length - 1 && { marginBottom: 10 }]}>
                <View style={[s.libInfoIcon, { backgroundColor: i.bg }]}><OfficeIcon name={i.icon as OfficeIconName} size={18} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.libInfoLabel}>{i.label}</Text>
                  <Text style={s.libInfoValue}>{i.value}</Text>
                </View>
              </View>
            );
            return i.key === 'contact' ? (
              <TouchableOpacity key={i.key} activeOpacity={0.7} onPress={() => Linking.openURL(`tel:${CLINIC.phone}`)}>{row}</TouchableOpacity>
            ) : (
              <View key={i.key}>{row}</View>
            );
          })}
        </View>

        <TouchableOpacity style={s.emergency} activeOpacity={0.8} onPress={call911}>
          <View style={{ marginRight: 12 }}><OfficeIcon name="siren" size={24} color={C.yellow} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.emergencyTitle}>For emergencies, call 911</Text>
            <Text style={s.emergencySub}>{CLINIC.emergencyNote}</Text>
          </View>
        </TouchableOpacity>

        <View style={s.rowBetween}>
          <Text style={[s.sectionTitle, { fontSize: 20 }]}>Health services</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }}>Walk-ins welcome</Text>
        </View>

        <TouchableOpacity style={s.libPlanRow} activeOpacity={0.7} onPress={request}>
          <View style={[s.libPlanIcon, { backgroundColor: '#F8E6E1' }]}><OfficeIcon name="calendarCheck" size={24} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.postName}>Request an appointment</Text>
            <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>Choose an available clinic time</Text>
          </View>
          <OfficeIcon name="chevronRight" size={20} color={C.muted} />
        </TouchableOpacity>

        <View style={s.rowCenter}>
          {CLINIC.services.map((svc, idx) => (
            <TouchableOpacity
              key={svc.key}
              style={[s.serviceTile, idx < CLINIC.services.length - 1 && { marginRight: 10 }]}
              activeOpacity={0.7}
              onPress={() => service(svc.key, svc.label, svc.icon as OfficeIconName)}
            >
              <OfficeIcon name={svc.icon as OfficeIconName} size={22} color={C.orange} />
              <Text style={s.serviceLabel}>{svc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {toast.node}
        {popup.node}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
