import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  AppState,
} from 'react-native';
import { BackButton } from '../components/BackButton';
import { Field } from '../components/Field';
import { ProgramSelect } from '../components/ProgramSelect';
import { YearSelect } from '../components/YearSelect';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { GoogleButton } from '../components/GoogleButton';
import { EmojiIcon } from '../components/ProfileIcon';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { PROGRAMS, YEARS } from '../data';
import { PASSWORD_RULE, SCHOOL_EMAIL_DOMAIN, campusLabel, isAllowedEmail, isStrongPassword, isValidName, norm } from '../utils';
import { checkVerified, discardUnverifiedAccount, friendlyAuthError, resendVerification, signUpAndSendVerification } from '../auth';

const CAMPUS = 'Technological Institute of the Philippines Q.C.';

type Errors = Partial<Record<'name' | 'email' | 'program' | 'year' | 'password' | 'confirm', string>>;

// `users` is no longer used (Firebase decides whether an email already exists); kept so App.tsx still compiles.
export function SignUpScreen({ onSignUp, onBack, onSwitch }: { users?: User[]; onSignUp: (u: User) => void; onBack: () => void; onSwitch: () => void }) {
  const [step, setStep] = useState<'details' | 'password' | 'verify'>('details');
  const [f, setF] = useState({ name: '', email: '', program: '', year: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const set = (k: keyof typeof f) => (t: string) => {
    setF({ ...f, [k]: t });
    if (errors[k as keyof Errors]) setErrors({ ...errors, [k]: undefined });
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Finish automatically when the student comes back from their mail app after tapping the link.
  useEffect(() => {
    if (step !== 'verify') return undefined;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') confirmVerified(true);
    });
    return () => sub.remove();
  }, [step]);

  const submitDetails = () => {
    const email = norm(f.email);
    const e: Errors = {};
    if (!f.name.trim()) e.name = 'Full name is required.';
    else if (!isValidName(f.name)) e.name = 'Use letters only. Numbers and special characters are not allowed.';
    if (!email) e.email = 'Email is required.';
    else if (!isAllowedEmail(email)) e.email = `Use your school email (name@${SCHOOL_EMAIL_DOMAIN}) or a Gmail address (name@gmail.com).`;
    if (!f.program.trim()) e.program = 'Please select your program.';
    else if (!PROGRAMS.some((p) => p.code === f.program)) e.program = 'Choose a program from the list.';
    if (!f.year.trim()) e.year = 'Please select your year.';
    else if (!(YEARS as readonly string[]).includes(f.year)) e.year = 'Choose a year from the list.';
    setErrors(e);
    if (Object.keys(e).length === 0) setStep('password');
  };

  const submitPassword = async () => {
    if (busy) return;
    const e: Errors = {};
    if (!isStrongPassword(f.password)) e.password = PASSWORD_RULE;
    if (f.confirm !== f.password || !f.confirm) e.confirm = 'Your passwords must match.';
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await signUpAndSendVerification({
        name: f.name.trim().replace(/\s+/g, ' '),
        email: f.email,
        password: f.password,
        university: CAMPUS,
        program: f.program.trim(),
        year: f.year.trim(),
      });
      setNotice('');
      setCooldown(30);
      setStep('verify');
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setErrors({ email: friendlyAuthError(err) });
        setStep('details');
      } else {
        setFormError(friendlyAuthError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmVerified = async (silent = false) => {
    if (busy) return;
    setBusy(true);
    try {
      const user = await checkVerified();
      if (user) onSignUp(user);
      else if (!silent) setNotice('Not verified yet. Open the link in the email, then tap this button again.');
    } catch (err: any) {
      if (!silent) setNotice(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    try {
      await resendVerification();
      setNotice('Verification email sent again.');
      setCooldown(30);
    } catch (err: any) {
      setNotice(friendlyAuthError(err));
    }
  };

  const changeEmail = async () => {
    setBusy(true);
    await discardUnverifiedAccount();
    setBusy(false);
    setNotice('');
    setErrors({});
    setStep('details');
  };

  if (step === 'verify') {
    return (
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={s.formTitle}>Verify your email.</Text>
          <Text style={s.formSub}>We sent a verification link to {norm(f.email)}. Open it, then come back here.</Text>
        </View>
        <ScrollView contentContainerStyle={[s.formContent, styles.scrollContent]} keyboardShouldPersistTaps="handled">
          <View style={s.infoCard}>
            <View style={s.infoCardRow}>
              <View style={{ marginRight: 10 }}><EmojiIcon glyph="✉️" /></View>
              <Text style={s.infoCardText}>Check your inbox and your spam or promotions folder. The email comes from Firebase and can take a minute to arrive.</Text>
            </View>
          </View>
          {!!notice && <Text style={[s.fieldHelper, { textAlign: 'center' }]}>{notice}</Text>}
        </ScrollView>
        <View style={s.bottomBar}>
          <PrimaryButton label="I’ve verified my email" busy={busy} onPress={() => confirmVerified(false)} />
          <TouchableOpacity onPress={resend} style={s.linkBtn}>
            <Text style={s.linkBtnText}>{cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={changeEmail} style={s.linkBtn}>
            <Text style={s.linkBtnText}>Wrong email? Use a different one</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const hasErrors = Object.values(errors).some(Boolean);

  if (step === 'password') {
    return (
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <BackButton onPress={() => { setStep('details'); setErrors({}); setFormError(''); }} />
          <Text style={s.formTitle}>Make it your own.</Text>
          <Text style={s.formSub}>Set a password. We’ll then email you a link to verify your address.</Text>
        </View>
        <ScrollView contentContainerStyle={[s.formContent, styles.scrollContent]} keyboardShouldPersistTaps="handled">
          <View style={s.summaryCard}>
            <Text style={s.summaryName}>{f.name.trim()}</Text>
            <Text style={s.summarySub}>{norm(f.email)} · {campusLabel(CAMPUS)}</Text>
          </View>
          <Field label="Password" icon="🔒" value={f.password} onChangeText={set('password')} placeholder="Create a password" secure errorText={errors.password} helper="At least 8 characters, uppercase and lowercase letters, and a number." />
          <Field label="Confirm password" icon="🔒" value={f.confirm} onChangeText={set('confirm')} placeholder="Re-enter your password" secure errorText={errors.confirm} helper="Your passwords must match." />
          {!!formError && (
            <View style={s.errorBox}>
              <Text style={{ color: C.error, marginRight: 8 }}>⚠️</Text>
              <Text style={s.errorText}>{formError}</Text>
            </View>
          )}
        </ScrollView>
        <View style={s.bottomBar}>
          <PrivacyNote text="A verification email will be sent to the address above." />
          <PrimaryButton label="Create account" busy={busy} onPress={submitPassword} />
          <TouchableOpacity onPress={() => { setStep('details'); setErrors({}); setFormError(''); }} style={s.linkBtn}>
            <Text style={s.linkBtnText}>Back to account details</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={s.formTitle}>Join your campus circle.</Text>
        <Text style={s.formSub}>Tell us a little about you. Your student details help Vicinia surface the most relevant communities.</Text>
      </View>
      <ScrollView contentContainerStyle={[s.formContent, styles.scrollContent]} keyboardShouldPersistTaps="handled">
        <Field label="Full name" icon="👤" value={f.name} onChangeText={set('name')} placeholder="Enter your full name" autoCapitalize="words" errorText={errors.name} />
        <Field label="Email address" icon="✉️" value={f.email} onChangeText={set('email')} placeholder="yourname@gmail.com" keyboardType="email-address" errorText={errors.email} helper={`Use a school email (@${SCHOOL_EMAIL_DOMAIN}) or a personal Gmail (@gmail.com).`} />
        <ProgramSelect value={f.program} onChange={set('program')} errorText={errors.program} />
        <YearSelect value={f.year} onChange={set('year')} errorText={errors.year}/>
        <GoogleButton onUser={onSignUp} />
      </ScrollView>
      <View style={s.bottomBar}>
        <PrivacyNote text={hasErrors ? 'Correct the highlighted fields to continue.' : 'We’ll email you a link to verify this address.'} />
        <PrimaryButton label="Continue" onPress={submitDetails} />
        <TouchableOpacity onPress={onSwitch} style={s.linkBtn}>
          <Text style={s.footLink}>Already have an account? <Text style={styles.bold}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '800' },
  // Stays pinned at the top while the form below scrolls.
  header: { paddingHorizontal: 20, paddingTop: 20, backgroundColor: C.cream },
  scrollContent: { paddingTop: 0 },
});
