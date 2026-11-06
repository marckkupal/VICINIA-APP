import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { BackButton } from '../components/BackButton';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { EmojiIcon } from '../components/ProfileIcon';
import { s } from '../styles';
import { C } from '../theme';
import { isAllowedEmail, norm } from '../utils';
import { beginPasswordReset, finishPasswordReset, friendlyAuthError, sendPasswordReset } from '../auth';

type Step = 'forgot' | 'sent' | 'reset' | 'done';

function Page({ children, footer, onBack }: { children: ReactNode; footer?: ReactNode; onBack: () => void }) {
  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
      </View>
      <ScrollView contentContainerStyle={[s.formContent, styles.scrollContent]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={s.bottomBar}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

// Forgot password: Firebase emails a confirmation link (no reset form in the email). The link reopens the app at
// vicinia://reset-password?oobCode=...&email=... App.tsx catches that URL at the root (even on a cold start) and passes it
// down as `link`, which unlocks the "Change Password" step here.
export function RecoveryFlow({ onExit, link, onLinkHandled }: { onExit: () => void; link?: string | null; onLinkHandled?: () => void }) {
  const [step, setStep] = useState<Step>('forgot');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);
  const handledCode = useRef('');
  const [resetEmail, setResetEmail] = useState('');
  const [linkError, setLinkError] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErrors, setPwErrors] = useState<{ next?: string; confirm?: string }>({});

  // Handles vicinia://reset-password?oobCode=...&email=... (the emailed link, passed on by the hosted page and App.tsx).
  useEffect(() => {
    if (!link || !link.includes('reset-password')) return;
    const code = /[?&]oobCode=([^&#]+)/.exec(link)?.[1];
    const mail = /[?&]email=([^&#]+)/.exec(link)?.[1];
    if (!code || !mail || handledCode.current === code) return;
    handledCode.current = code;
    onLinkHandled?.();
    (async () => {
      try {
        const confirmed = await beginPasswordReset(decodeURIComponent(code), decodeURIComponent(mail));
        setResetEmail(confirmed);
        setNewPw('');
        setConfirmPw('');
        setPwErrors({});
        setLinkError('');
        setStep('reset');
      } catch (e: any) {
        setLinkError(friendlyAuthError(e));
        setStep('sent');
      }
    })();
  }, [link]);

  const savePassword = async () => {
    if (busy) return;
    const e: { next?: string; confirm?: string } = {};
    if (newPw.length < 8) e.next = 'Use at least 8 characters.';
    if (confirmPw !== newPw) e.confirm = 'Passwords do not match.';
    setPwErrors(e);
    if (e.next || e.confirm) return;
    setBusy(true);
    try {
      await finishPasswordReset(newPw);
      setNewPw('');
      setConfirmPw('');
      setStep('done');
    } catch (err: any) {
      if (err?.code === 'auth/expired-action-code' || err?.code === 'auth/invalid-action-code') {
        setLinkError(friendlyAuthError(err));
        setStep('sent');
      } else if (err?.code === 'auth/weak-password') {
        setPwErrors({ next: 'Password is too weak. Use at least 8 characters.' });
      } else {
        setPwErrors({ confirm: friendlyAuthError(err) });
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (isResend = false) => {
    if (busy) return;
    if (!isAllowedEmail(email)) return setEmailError('Use your school email (name@tip.edu.ph) or a Gmail address (name@gmail.com).');
    setEmailError('');
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setResent(isResend);
      setCooldown(30);
      setStep('sent');
    } catch (e: any) {
      setEmailError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const textLink = (label: string, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} style={s.linkBtn}>
      <Text style={s.linkBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  if (step === 'done') {
    return (
      <Page onBack={onExit}>
        <View style={styles.checkWrap}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>
        <Text style={[s.formTitle, { textAlign: 'center' }]}>Password changed!</Text>
        <Text style={[s.formSub, { textAlign: 'center' }]}>Your password has been updated. Log in with your new password.</Text>
        <View style={{ marginTop: 8 }}>
          <PrimaryButton label="Return to Login" onPress={onExit} />
        </View>
      </Page>
    );
  }

  if (step === 'reset') {
    return (
      <Page
        onBack={onExit}
        footer={<>
          <PrivacyNote text="Your new password is never shown or stored on this device." />
          <PrimaryButton label="Save" busy={busy} onPress={savePassword} />
        </>}
      >
        <Text style={s.formTitle}>Change Password</Text>
        <Text style={s.formSub}>Choose a new password for {resetEmail}.</Text>
        <Field label="New password" icon="🔒" value={newPw} onChangeText={(t) => { setNewPw(t); setPwErrors({ ...pwErrors, next: undefined }); }} placeholder="At least 8 characters" secure errorText={pwErrors.next} />
        <Field label="Confirm new password" icon="🔒" value={confirmPw} onChangeText={(t) => { setConfirmPw(t); setPwErrors({ ...pwErrors, confirm: undefined }); }} placeholder="Re-enter new password" secure errorText={pwErrors.confirm} />
      </Page>
    );
  }

  if (step === 'sent') {
    return (
      <Page
        onBack={() => setStep('forgot')}
        footer={<>
          <PrivacyNote text="We never confirm whether an email has an account." />
          <PrimaryButton label={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'} onPress={() => { if (cooldown <= 0) send(true); }} />
          {textLink('Return to log in', onExit)}
        </>}
      >
        <Text style={s.formTitle}>Check your inbox.</Text>
        <Text style={s.formSub}>If an account exists for {norm(email)}, we’ve sent a link to reset your password. For your privacy, we don’t confirm whether an account exists.</Text>
        <View style={s.infoCard}>
          <View style={s.infoCardRow}>
            <View style={{ marginRight: 10 }}><EmojiIcon glyph="✉️" /></View>
            <Text style={s.infoCardText}>Open the email and tap the link to confirm it’s you. The Vicinia app opens and lets you choose a new password. Check your spam folder if you don’t see it.</Text>
          </View>
        </View>
        {!!linkError && <Text style={[s.fieldHelper, { textAlign: 'center', color: C.error }]}>{linkError}</Text>}
        {resent && <Text style={[s.fieldHelper, { textAlign: 'center', color: '#2E7D4F' }]}>Email sent again.</Text>}
        {textLink('Use a different email', () => setStep('forgot'))}
      </Page>
    );
  }

  return (
    <Page
      onBack={onExit}
      footer={<>
        <PrivacyNote text="We’ll email you a link to reset your password." />
        <PrimaryButton label="Send reset link" busy={busy} onPress={() => send(false)} />
        {textLink('Back to log in', onExit)}
      </>}
    >
      <Text style={s.formTitle}>Forgot your password?</Text>
      <Text style={s.formSub}>Enter your email and we’ll send you a link to reset your password.</Text>
      <Field label="Email" icon="✉️" value={email} onChangeText={(t) => { setEmail(t); setEmailError(''); }} placeholder="yourname@gmail.com" keyboardType="email-address" errorText={emailError} helper="Use your school email (@tip.edu.ph) or Gmail (@gmail.com)." />
    </Page>
  );
}

const styles = StyleSheet.create({
  // Pinned above the scrolling form.
  header: { paddingHorizontal: 20, paddingTop: 20, backgroundColor: C.cream },
  scrollContent: { paddingTop: 0 },
  checkWrap: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  checkCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#2E7D4F', alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#FFFFFF', fontSize: 52, fontWeight: '800', lineHeight: 60 },
});
