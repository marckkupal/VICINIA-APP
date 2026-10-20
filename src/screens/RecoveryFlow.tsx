import { useEffect, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BackButton } from '../components/BackButton';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { s } from '../styles';
import { EMAIL_REGEX, PASSWORD_RULE, isStrongPassword, norm } from '../utils';

type Step = 'forgot' | 'sent' | 'reset' | 'done';

function Page({ children, footer, onBack }: { children: ReactNode; footer: ReactNode; onBack: () => void }) {
  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.formContent} keyboardShouldPersistTaps="handled">
        <BackButton onPress={onBack} />
        {children}
      </ScrollView>
      <View style={s.bottomBar}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

// Demo-only password recovery: no email is sent and no stored password changes.
export function RecoveryFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState<Step>('forgot');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = () => {
    if (cooldown > 0) return;
    setResent(true);
    setCooldown(30);
  };

  const send = () => {
    if (!EMAIL_REGEX.test(norm(email))) return setEmailError('Enter a valid school email, e.g. name@tip.edu.ph.');
    setEmailError('');
    setResent(false);
    setStep('sent');
  };

  const reset = () => {
    const pe = isStrongPassword(pw) ? '' : PASSWORD_RULE;
    const ce = pw && confirm === pw ? '' : 'Both passwords must match.';
    setPwError(pe);
    setConfirmError(ce);
    if (!pe && !ce) setStep('done');
  };

  const textLink = (label: string, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} style={s.linkBtn}>
      <Text style={s.linkBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  if (step === 'sent') {
    return (
      <Page
        onBack={() => setStep('forgot')}
        footer={<>
          <PrivacyNote text="This is a simulated response. No actual email was sent." />
          <PrimaryButton label={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend instructions'} onPress={resend} />
          {textLink('Return to log in', onExit)}
        </>}
      >
        <Text style={s.formTitle}>Check your inbox.</Text>
        <Text style={s.formSub}>If an account exists for that school email, recovery instructions would be sent. For your privacy, we don’t confirm whether an account exists.</Text>
        <View style={s.infoCard}>
          <View style={s.infoCardRow}>
            <Text style={{ marginRight: 10 }}>✉️</Text>
            <Text style={s.infoCardText}>In a live service, check your inbox and spam folder, then follow the password reset instructions.</Text>
          </View>
        </View>
        {resent && <Text style={[s.fieldHelper, { textAlign: 'center', color: '#2E7D4F' }]}>Instructions sent again (simulated).</Text>}
        <Text style={[s.fieldHelper, { textAlign: 'center' }]}>Need another try? Check your email address before resending.</Text>
        {textLink('Use a different school email', () => setStep('forgot'))}
        {textLink('Continue to reset (demo)', () => setStep('reset'))}
      </Page>
    );
  }

  if (step === 'reset') {
    return (
      <Page
        onBack={() => setStep('sent')}
        footer={<>
          <PrivacyNote text="Demo only. Your real account password will not change." />
          <PrimaryButton label="Reset password · Demo" onPress={reset} />
          {textLink('Return to log in', onExit)}
        </>}
      >
        <Text style={s.formTitle}>Set a new password.</Text>
        <Text style={s.formSub}>Choose a password you haven’t used before for your campus account.</Text>
        <Field label="New password" icon="🔒" value={pw} onChangeText={(t) => { setPw(t); setPwError(''); }} secure errorText={pwError} />
        <Field label="Confirm new password" icon="🔒" value={confirm} onChangeText={(t) => { setConfirm(t); setConfirmError(''); }} secure errorText={confirmError} helper="Both passwords must match." />
        <View style={s.infoCard}>
          <Text style={s.infoCardTitle}>Password guidance</Text>
          <Text style={s.infoCardText}>Use at least 8 characters, with an uppercase letter, a lowercase letter, and a number. Avoid using your name or school email.</Text>
        </View>
      </Page>
    );
  }

  if (step === 'done') {
    return (
      <Page
        onBack={onExit}
        footer={<>
          <PrivacyNote text="Simulated success only. No authentication service was used and no real password changed." />
          <PrimaryButton label="Return to log in" onPress={onExit} />
        </>}
      >
        <Text style={s.formTitle}>You’re all set.</Text>
        <Text style={s.formSub}>Password reset complete — in this demo. You can return to the log in screen to continue exploring Vicinia.</Text>
        <View style={s.successCard}>
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.successTitle}>Demo password reset complete</Text>
          <Text style={s.infoCardText}>Keep your password private. Vicinia will never ask you to share it in a campus board or post.</Text>
        </View>
      </Page>
    );
  }

  return (
    <Page
      onBack={onExit}
      footer={<>
        <PrivacyNote text="Demo only. No recovery email will be sent." />
        <PrimaryButton label="Send recovery instructions" onPress={send} />
        {textLink('Back to log in', onExit)}
      </>}
    >
      <Text style={s.formTitle}>Forgot your password?</Text>
      <Text style={s.formSub}>Enter your school email to see the recovery instructions for your campus account.</Text>
      <Field label="School email" icon="✉️" value={email} onChangeText={(t) => { setEmail(t); setEmailError(''); }} placeholder="jdelacruz@tip.edu.ph" keyboardType="email-address" errorText={emailError} helper="Use the school email associated with your account." />
    </Page>
  );
}
