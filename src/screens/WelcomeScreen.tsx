import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { LogoMark } from '../components/LogoMark';
import { PrimaryButton } from '../components/PrimaryButton';
import { s } from '../styles';
import { C } from '../theme';

export function WelcomeScreen({ onSignUp, onLogin }: { onSignUp: () => void; onLogin: () => void }) {
  return (
    <View style={[s.fill, { backgroundColor: C.yellow, padding: 24 }]}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24 }}>
        <LogoMark size={40} />
        <Text style={[s.navWordmark, { color: C.dark, fontSize: 22 }]}>  Vicinia</Text>
      </View>
      <Text style={[s.introTitle, { textAlign: 'left', marginTop: 24, fontSize: 36 }]}>Your campus,{'\n'}closer than ever.</Text>
      <Text style={[s.introBody, { textAlign: 'left', paddingHorizontal: 0 }]}>
        Find people, places, events, communities, and wellbeing support around TIP Quezon City.
      </Text>
      <View style={s.heroCard}>
        <View style={s.heroCircle}><Text style={{ fontSize: 30 }}>📍</Text></View>
        <View style={s.heroPill}><Text style={s.heroPillText}>TIP · Quezon City</Text></View>
      </View>
      <PrimaryButton dark label="Create my account" onPress={onSignUp} />
      <TouchableOpacity onPress={onLogin} style={{ marginTop: 14, alignItems: 'center' }}>
        <Text style={s.footLink}>Already have an account? <Text style={{ fontWeight: '800' }}>Sign in</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
