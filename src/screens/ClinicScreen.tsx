import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { BackButton } from '../components/BackButton';
import { CLINIC } from '../data';
import { s } from '../styles';
import { C } from '../theme';

export function ClinicScreen({ onBack }: { onBack: () => void }) {
  const soon = (title: string) => Alert.alert(title, 'This feature is coming soon.');
  const call911 = () =>
    Linking.openURL('tel:911').catch(() => Alert.alert('Unable to call', 'Please dial 911 directly.'));

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.libTitle}>Clinic</Text>
          <Text style={s.libSub}>University Health Service</Text>
        </View>
        <TouchableOpacity style={s.libAddBtn} onPress={() => soon('Quick actions')}>
          <Text style={{ fontWeight: '900', fontSize: 20, color: C.yellow, marginTop: -1 }}>+</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, marginLeft: 12 }}>❤️</Text>
      </View>

      <View style={s.clinicHero}>
        <View style={s.clinicHeroIcon}><Text style={{ fontSize: 30, color: C.yellow, fontWeight: '900' }}>✚</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.libHeroTitle}>{CLINIC.name}</Text>
          <Text style={s.libHeroBody}>{CLINIC.blurb}</Text>
        </View>
      </View>

      <View style={s.libInfoCard}>
        {CLINIC.info.map((i, idx) => {
          const row = (
            <View style={[s.rowCenter, idx < CLINIC.info.length - 1 && { marginBottom: 10 }]}>
              <View style={[s.libInfoIcon, { backgroundColor: i.bg }]}><Text style={{ fontSize: 16 }}>{i.icon}</Text></View>
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
        <Text style={{ fontSize: 20, marginRight: 12 }}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.emergencyTitle}>For emergencies, call 911</Text>
          <Text style={s.emergencySub}>{CLINIC.emergencyNote}</Text>
        </View>
      </TouchableOpacity>

      <View style={s.rowBetween}>
        <Text style={[s.sectionTitle, { fontSize: 20 }]}>Health services</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }}>Walk-ins welcome</Text>
      </View>

      <TouchableOpacity style={s.libPlanRow} activeOpacity={0.7} onPress={() => soon('Request an appointment')}>
        <View style={[s.libPlanIcon, { backgroundColor: '#F8E6E1' }]}><Text style={{ fontSize: 22 }}>🗓️</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.postName}>Request an appointment</Text>
          <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>Choose an available clinic time</Text>
        </View>
        <Text style={s.menuChevron}>›</Text>
      </TouchableOpacity>

      <View style={s.rowCenter}>
        {CLINIC.services.map((svc, idx) => (
          <TouchableOpacity
            key={svc.key}
            style={[s.serviceTile, idx < CLINIC.services.length - 1 && { marginRight: 10 }]}
            activeOpacity={0.7}
            onPress={() => soon(svc.label)}
          >
            <Text style={{ fontSize: 20 }}>{svc.icon}</Text>
            <Text style={s.serviceLabel}>{svc.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
