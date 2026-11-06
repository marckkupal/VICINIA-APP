import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { BackButton } from '../components/BackButton';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { GoogleButton } from '../components/GoogleButton';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { EMAIL_REGEX, norm } from '../utils';
import { friendlyAuthError, logIn, resendVerification } from '../auth';

// `users` is no longer used (Firebase checks the credentials); kept so App.tsx still compiles.
export function LoginScreen({ onLogin, onBack, onSwitch, onForgot }: { users?: User[]; onLogin: (u: User) => void; onBack: () => void; onSwitch: () => void; onForgot?: () => void }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setInfo('');
    setUnverified(false);
    if (!EMAIL_REGEX.test(norm(id)) || !pw) return setError('Enter your email and password.');
    setBusy(true);
    try {
      const res = await logIn(id, pw);
      if (res.status === 'ok') onLogin(res.user);
      else setUnverified(true);
    } catch (e: any) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await resendVerification();
      setInfo('Verification email sent. Open the link, then tap Log In again.');
    } catch (e: any) {
      setInfo(friendlyAuthError(e));
    }
  };

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={s.formTitle}>Welcome back to your campus.</Text>
        <Text style={s.formSub}>Log in to Vicinia and reconnect with your campus circle.</Text>
      </View>
      <ScrollView contentContainerStyle={[s.formContent, styles.scrollContent]} keyboardShouldPersistTaps="handled">
        <Field label="Email" icon="✉️" placeholder="Enter your email" value={id} onChangeText={(t) => { setId(t); setError(''); setUnverified(false); }} error={!!error} keyboardType="email-address" />
        <Field label="Password" icon="🔒" placeholder="Enter your password" value={pw} onChangeText={(t) => { setPw(t); setError(''); setUnverified(false); }} secure error={!!error} />
        {!!error && (
          <View style={s.errorBox}>
            <Text style={{ color: C.error, marginRight: 8 }}>⚠️</Text>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}
        {unverified && (
          <View style={s.infoCard}>
            <Text style={s.infoCardTitle}>Verify your email first</Text>
            <Text style={s.infoCardText}>This account isn’t verified yet. Open the link we emailed you, or send a new one.</Text>
            <TouchableOpacity onPress={resend} style={s.linkBtn}>
              <Text style={s.linkBtnText}>Resend verification email</Text>
            </TouchableOpacity>
            {!!info && <Text style={[s.fieldHelper, { textAlign: 'center' }]}>{info}</Text>}
          </View>
        )}
        {!!onForgot && (
          <TouchableOpacity onPress={onForgot} style={{ alignSelf: 'center', marginTop: 12 }}>
            <Text style={s.linkBtnText}>Forgot password?</Text>
          </TouchableOpacity>
        )}
        <GoogleButton onUser={onLogin} />
      </ScrollView>
      <View style={s.bottomBar}>
        <PrivacyNote />
        <PrimaryButton label="Log In" onPress={submit} busy={busy} />
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
