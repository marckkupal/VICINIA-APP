import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { friendlyAuthError } from '../auth';
import { signInWithGoogle } from '../googleAuth';

// "or" divider + Continue with Google. Works for both log in and sign up: Google creates the account the first time.
export function GoogleButton({ onUser }: { onUser: (u: User) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const press = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const u = await signInWithGoogle();
      if (u) onUser(u);
    } catch (e: any) {
      console.warn('Google sign-in failed', e?.code, e?.message, e);
      // While developing, also show the real reason from the Google SDK. Hidden in release builds.
      setError(friendlyAuthError(e) + (__DEV__ && e?.message ? `\n${e.message}` : ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>or</Text>
        <View style={styles.line} />
      </View>
      <TouchableOpacity onPress={press} disabled={busy} style={[styles.btn, busy && { opacity: 0.6 }]}>
        <Text style={styles.g}>G</Text>
        <Text style={styles.label}>{busy ? 'Signing in…' : 'Continue with Google'}</Text>
      </TouchableOpacity>
      {!!error && <Text style={[s.fieldHelper, { textAlign: 'center', color: C.error, marginTop: 8 }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  line: { flex: 1, height: 1, backgroundColor: '#D9D4C7' },
  or: { marginHorizontal: 12, fontSize: 13, color: '#7A7567' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9D4C7' },
  g: { fontSize: 20, fontWeight: '800', color: '#4285F4', marginRight: 10 },
  label: { fontSize: 15, fontWeight: '700', color: C.dark },
});
