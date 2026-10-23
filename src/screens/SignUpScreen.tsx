import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { BackButton } from '../components/BackButton';
import { Field } from '../components/Field';
import { ProgramSelect } from '../components/ProgramSelect';
import { YearSelect } from '../components/YearSelect';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { PROGRAMS, YEARS } from '../data';
import { PASSWORD_RULE, SCHOOL_EMAIL_DOMAIN, campusLabel, isSchoolEmail, isStrongPassword, isValidName, norm } from '../utils';

const CAMPUS = 'Technological Institute of the Philippines Q.C.';

type Errors = Partial<Record<'name' | 'email' | 'program' | 'year' | 'password' | 'confirm', string>>;

export function SignUpScreen({ users, onSignUp, onBack, onSwitch }: { users: User[]; onSignUp: (u: User) => void; onBack: () => void; onSwitch: () => void }) {
  const [step, setStep] = useState<'details' | 'password'>('details');
  const [f, setF] = useState({ name: '', email: '', program: '', year: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const set = (k: keyof typeof f) => (t: string) => {
    setF({ ...f, [k]: t });
    if (errors[k as keyof Errors]) setErrors({ ...errors, [k]: undefined });
  };

  const submitDetails = () => {
    const email = norm(f.email);
    const e: Errors = {};
    if (!f.name.trim()) e.name = 'Full name is required.';
    else if (!isValidName(f.name)) e.name = 'Use letters only. Numbers and special characters are not allowed.';
    if (!email) e.email = 'School email is required.';
    else if (!isSchoolEmail(email)) e.email = `Use your school email, e.g. name@${SCHOOL_EMAIL_DOMAIN}. Other addresses are not accepted.`;
    else if (users.some((u) => norm(u.email) === email)) e.email = 'An account with this email already exists. Log in instead.';
    if (!f.program.trim()) e.program = 'Please select your program.';
    else if (!PROGRAMS.some((p) => p.code === f.program)) e.program = 'Choose a program from the list.';
    if (!f.year.trim()) e.year = 'Please select your year.';
    else if (!(YEARS as readonly string[]).includes(f.year)) e.year = 'Choose a year from the list.';
    setErrors(e);
    if (Object.keys(e).length === 0) setStep('password');
  };

  const submitPassword = () => {
    const e: Errors = {};
    // Re-check at the final step so one email can never end up with two accounts.
    if (users.some((u) => norm(u.email) === norm(f.email))) e.email = 'An account with this email already exists. Log in instead.';
    if (!isStrongPassword(f.password)) e.password = PASSWORD_RULE;
    if (f.confirm !== f.password || !f.confirm) e.confirm = 'Your passwords must match.';
    setErrors(e);
    if (e.email) { setStep('details'); return; }
    if (Object.keys(e).length) return;
    onSignUp({ name: f.name.trim().replace(/\s+/g, ' '), email: norm(f.email), password: f.password, university: CAMPUS, program: f.program.trim(), year: f.year.trim() });
  };

  const hasErrors = Object.values(errors).some(Boolean);

  if (step === 'password') {
    return (
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <BackButton onPress={() => { setStep('details'); setErrors({}); }} />
          <Text style={s.formTitle}>Make it your own.</Text>
          <Text style={s.formSub}>Set a password to complete your demo account setup.</Text>
        </View>
        <ScrollView contentContainerStyle={[s.formContent, styles.scrollContent]} keyboardShouldPersistTaps="handled">
          <View style={s.summaryCard}>
            <Text style={s.summaryName}>{f.name.trim()}</Text>
            <Text style={s.summarySub}>{norm(f.email)} · {campusLabel(CAMPUS)}</Text>
          </View>
          <Field label="Password" icon="🔒" value={f.password} onChangeText={set('password')} placeholder="Create a password" secure errorText={errors.password} helper="At least 8 characters, uppercase and lowercase letters, and a number." />
          <Field label="Confirm password" icon="🔒" value={f.confirm} onChangeText={set('confirm')} placeholder="Re-enter your password" secure errorText={errors.confirm} helper="Your passwords must match." />
        </ScrollView>
        <View style={s.bottomBar}>
          <PrivacyNote text="Demo submission only. No real account, authentication, or database record is created." />
          <PrimaryButton label="Create demo account" onPress={submitPassword} />
          <TouchableOpacity onPress={() => { setStep('details'); setErrors({}); }} style={s.linkBtn}>
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
        <Field label="School email address" icon="✉️" value={f.email} onChangeText={set('email')} placeholder={`yourname@${SCHOOL_EMAIL_DOMAIN}`} keyboardType="email-address" errorText={errors.email} helper={`Only @${SCHOOL_EMAIL_DOMAIN} addresses are accepted.`} />
        <ProgramSelect value={f.program} onChange={set('program')} errorText={errors.program} />
        <YearSelect value={f.year} onChange={set('year')} errorText={errors.year}/>
      </ScrollView>
      <View style={s.bottomBar}>
        <PrivacyNote text={hasErrors ? 'Demo form only. Correct the highlighted fields to continue; no real account will be created.' : 'Demo form only. No real account will be created.'} />
        <PrimaryButton label="Create account" onPress={submitDetails} />
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
