import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { BackButton } from '../components/BackButton';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { norm } from '../utils';

export function LoginScreen({ users, onLogin, onBack, onSwitch, onForgot }: { users: User[]; onLogin: (u: User) => void; onBack: () => void; onSwitch: () => void; onForgot?: () => void }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    const key = norm(id);
    const match = users.find(
      (u) => (norm(u.email) === key || norm(u.email.split('@')[0]) === key) && u.password === pw
    );
    if (!match) return setError(true);
    onLogin(match);
  };

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={s.formTitle}>Welcome back to your campus.</Text>
        <Text style={s.formSub}>Log in to Vicinia and reconnect with your campus circle.</Text>
      </View>
      <ScrollView contentContainerStyle={[s.formContent, styles.scrollContent]} keyboardShouldPersistTaps="handled">
        <Field label="Email or username" icon="✉️" placeholder="Enter your email or username" value={id} onChangeText={(t) => { setId(t); setError(false); }} error={error} keyboardType="email-address" />
        <Field label="Password" icon="🔒" placeholder="Enter your password" value={pw} onChangeText={(t) => { setPw(t); setError(false); }} secure error={error} />
        {error && (
          <View style={s.errorBox}>
            <Text style={{ color: C.error, marginRight: 8 }}>⚠️</Text>
            <Text style={s.errorText}>Incorrect email, username, or password. Please try again.</Text>
          </View>
        )}
        {!!onForgot && (
          <TouchableOpacity onPress={onForgot} style={{ alignSelf: 'center', marginTop: 12 }}>
            <Text style={s.linkBtnText}>Forgot password?</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <View style={s.bottomBar}>
        <PrivacyNote />
        <PrimaryButton label="Log In" onPress={submit} />
        <TouchableOpacity onPress={onSwitch} style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={s.footLink}>New to Vicinia? <Text style={{ fontWeight: '800' }}>Create an account</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Pinned above the scrolling form.
  header: { paddingHorizontal: 20, paddingTop: 20, backgroundColor: C.cream },
  scrollContent: { paddingTop: 0 },
});
