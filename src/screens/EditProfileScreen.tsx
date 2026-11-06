import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, BackHandler, StyleSheet } from 'react-native';
import { KeyboardScreen, KeyboardScroll } from '../components/KeyboardAware';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { ImagePickerResponse } from 'react-native-image-picker';
import { Avatar } from '../components/Avatar';
import { BackButton } from '../components/BackButton';
import { DiscardModal } from '../components/DiscardModal';
import { Field } from '../components/Field';
import { ProgramSelect } from '../components/ProgramSelect';
import { YearSelect } from '../components/YearSelect';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { fetchAccountProfile, friendlyAuthError } from '../auth';
import { assetUri } from '../persist';
import { AVATAR_MAX_CHARS, NAME_MAX, UNIVERSITY_MAX, profileChanged } from '../profileRules';
import { submitProfile } from '../profileSave';
import type { ProfileErrors } from '../profileRules';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { campusLabel } from '../utils';

// Photos are shrunk before they are kept on the account (see AVATAR_MAX_CHARS).
const PHOTO = { mediaType: 'photo', quality: 0.7, maxWidth: 320, maxHeight: 320, includeBase64: true } as const;

// Which fields live where:
//  - name, university, program, year, photo: the account (Firestore, through updateProfile in auth.ts). Loaded when this screen opens.
//  - email: the login, shown but not editable here.
// `onSave` is called only after the account has been updated, with the saved profile; the app then updates its signed-in user.
export function EditProfileScreen({ user, onSave, onClose }: { user: User; onSave: (u: User) => void | Promise<void>; onClose: () => void }) {
  const [base, setBase] = useState(user);   // what is saved on the account (the "before")
  const [draft, setDraft] = useState(user); // what the form currently shows
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false); // shown only after the account confirmed the save
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // Load the saved profile from the account when the screen opens. Anything typed meanwhile is kept.
  useEffect(() => {
    let live = true;
    setLoading(true);
    setLoadError(null);
    fetchAccountProfile()
      .then((p) => {
        if (!live) return;
        const fresh: User = { ...user, ...p, avatarUri: p.avatarUri ?? user.avatarUri };
        setBase(fresh);
        setDraft((d) => (profileChanged(d, user) ? d : fresh));
        setLoading(false);
      })
      .catch((e) => {
        if (!live) return;
        setLoading(false);
        setLoadError(friendlyAuthError(e));
      });
    return () => { live = false; };
  }, [attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = profileChanged(draft, base);
  const set = (k: 'name' | 'university' | 'program' | 'year') => (t: string) => {
    setDraft((d) => ({ ...d, [k]: t }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setSubmitError(null);
    setJustSaved(false);
  };

  // Ask before leaving only when something was actually changed. Ignored while a save is running.
  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  // Android back button follows the same rule as the Back and Cancel buttons.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { requestClose(); return true; });
    return () => sub.remove();
  }, [dirty, saving, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const takePicked = (r: ImagePickerResponse, cameraErrors: boolean) => {
    if (r.didCancel) return;
    if (r.errorCode) {
      if (!cameraErrors) return Alert.alert('Could not open photos', r.errorMessage ?? 'Please try again.');
      const msg =
        r.errorCode === 'permission'
          ? 'Camera access was denied. Allow the camera for this app in your phone settings, then try again.'
          : r.errorCode === 'camera_unavailable'
            ? 'No camera is available on this device.'
            : r.errorMessage ?? 'Please try again.';
      return Alert.alert('Could not open the camera', msg);
    }
    const a = r.assets?.[0];
    const uri = a ? assetUri(a) : undefined;
    if (!uri) return;
    if (uri.length > AVATAR_MAX_CHARS) return Alert.alert('Photo is too large', 'Choose a smaller photo.');
    setDraft((d) => ({ ...d, avatarUri: uri }));
    setSubmitError(null);
    setJustSaved(false);
  };
  const pickImage = async () => takePicked(await launchImageLibrary({ ...PHOTO, selectionLimit: 1 }), false);
  const takePhoto = async () => takePicked(await launchCamera({ ...PHOTO, cameraType: 'front', saveToPhotos: false }), true);

  const changePhoto = () => {
    if (saving) return;
    Alert.alert('Profile photo', undefined, [
      { text: 'Take a photo', onPress: takePhoto },
      { text: 'Choose from gallery', onPress: pickImage },
      ...(draft.avatarUri
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => { setDraft((d) => ({ ...d, avatarUri: undefined })); setJustSaved(false); } }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const save = async () => {
    if (saving || loading || loadError) return;
    setSaving(true);
    setSubmitError(null);
    setJustSaved(false);
    let out;
    try {
      out = await submitProfile(draft, base, onSave);
    } catch {
      // The account was updated but the app could not take over; do not claim more than we know.
      out = { ok: false as const, kind: 'failed' as const, message: 'Saved to your account, but the app could not refresh. Close and reopen this screen.' };
    }
    if (!mounted.current) return;
    setSaving(false);
    if (out.ok) {
      setBase(out.saved); // the form now matches the account, so it is no longer "changed"
      setDraft(out.saved);
      setJustSaved(true);
    } else if (out.kind === 'invalid') setErrors(out.errors);
    else if (out.kind === 'failed') setSubmitError(out.message);
  };

  const hasErrors = Object.values(errors).some(Boolean);
  const note = loading ? 'Loading your saved profile…'
    : saving ? 'Saving your changes…'
    : hasErrors ? 'Check the highlighted fields.'
    : 'Changes are saved to your account.';

  return (
    <KeyboardScreen style={s.fill}>
      <View style={[s.rowBetween, styles.header]}>
        <View style={s.rowCenter}>
          <BackButton onPress={requestClose} />
          <Text style={[s.header, { marginBottom: 0, marginLeft: 10, fontSize: 18 }]}>Edit Profile</Text>
        </View>
        <TouchableOpacity onPress={requestClose} disabled={saving} style={saving ? { opacity: 0.5 } : undefined}><Text style={{ fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
      </View>
      <KeyboardScroll contentContainerStyle={styles.scrollContent}>
        {!!loadError && (
          <View style={[s.errorBox, { marginBottom: 14 }]} accessibilityLiveRegion="polite">
            <Text style={s.errorText}>Couldn’t load your saved profile. {loadError}</Text>
            <TouchableOpacity onPress={() => setAttempt((n) => n + 1)} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontWeight: '800', marginLeft: 10 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={[s.darkCard, { marginTop: 4, marginBottom: 20 }]}>
          <TouchableOpacity onPress={changePhoto} activeOpacity={0.8}>
            <Avatar user={draft} size={72} />
            <View style={s.cameraBadge}><Text style={{ fontSize: 10 }}>📷</Text></View>
          </TouchableOpacity>
          <View style={{ marginLeft: 14 }}>
            <Text style={s.darkName}>{draft.name || 'Your name'}</Text>
            <Text style={s.darkSub}>{campusLabel(draft.university)}</Text>
            <TouchableOpacity onPress={changePhoto}><Text style={s.darkLink}>Change profile photo</Text></TouchableOpacity>
          </View>
        </View>
        <Field label="Full name" icon="👤" value={draft.name} onChangeText={set('name')} placeholder="Enter your full name" autoCapitalize="words" errorText={errors.name} maxLength={NAME_MAX} />
        <Field label="Email" icon="✉️" value={draft.email} onChangeText={() => {}} editable={false} helper="This is your login, so it can’t be changed here." />
        <Field label="University" icon="🎓" value={draft.university} onChangeText={set('university')} autoCapitalize="words" errorText={errors.university} maxLength={UNIVERSITY_MAX} />
        <ProgramSelect value={draft.program} onChange={set('program')} errorText={errors.program} />
        <YearSelect value={draft.year} onChange={set('year')} errorText={errors.year} />
      </KeyboardScroll>
      <View style={s.bottomBar}>
        {!!submitError && (
          <View style={[s.errorBox, { marginBottom: 10 }]} accessibilityLiveRegion="assertive">
            <Text style={s.errorText}>{submitError}</Text>
          </View>
        )}
        {justSaved && (
          <View style={[s.successBanner, { marginBottom: 10 }]} accessibilityLiveRegion="polite">
            <Text style={s.successBannerText}>✓  Saved to your account.</Text>
          </View>
        )}
        <PrivacyNote text={note} />
        <PrimaryButton label="Save Changes" onPress={save} busy={saving} disabled={loading || !!loadError || !dirty} />
      </View>
      <DiscardModal visible={confirmDiscard} onKeep={() => setConfirmDiscard(false)} onDiscard={() => { setConfirmDiscard(false); onClose(); }} />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  // Pinned above the scrolling form.
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, backgroundColor: C.cream },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
});
