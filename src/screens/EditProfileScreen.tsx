import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Avatar } from '../components/Avatar';
import { BackButton } from '../components/BackButton';
import { DiscardModal } from '../components/DiscardModal';
import { Field } from '../components/Field';
import { ProgramSelect } from '../components/ProgramSelect';
import { YearSelect } from '../components/YearSelect';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { s } from '../styles';
import type { User } from '../types';
import { EMAIL_REGEX, campusLabel, norm } from '../utils';

const same = (a: User, b: User) =>
  a.name === b.name && a.email === b.email && a.university === b.university && a.program === b.program && a.year === b.year && a.avatarUri === b.avatarUri;

export function EditProfileScreen({ user, onSave, onClose }: { user: User; onSave: (u: User) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(user);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const set = (k: keyof User) => (t: string) => {
    setDraft({ ...draft, [k]: t });
    if (k === 'name' || k === 'email') setErrors({ ...errors, [k]: undefined });
  };

  // Ask before leaving only when something was actually changed.
  const requestClose = () => (same(draft, user) ? onClose() : setConfirmDiscard(true));

  const pickImage = async () => {
    const r = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8, maxWidth: 800, maxHeight: 800 });
    if (r.didCancel) return;
    if (r.errorCode) return Alert.alert('Could not open photos', r.errorMessage ?? 'Please try again.');
    const uri = r.assets?.[0]?.uri;
    if (uri) setDraft({ ...draft, avatarUri: uri });
  };

  const takePhoto = async () => {
    const r = await launchCamera({ mediaType: 'photo', cameraType: 'front', saveToPhotos: false, quality: 0.8, maxWidth: 800, maxHeight: 800 });
    if (r.didCancel) return;
    if (r.errorCode) {
      const msg =
        r.errorCode === 'permission'
          ? 'Camera access was denied. Allow the camera for this app in your phone settings, then try again.'
          : r.errorCode === 'camera_unavailable'
            ? 'No camera is available on this device.'
            : r.errorMessage ?? 'Please try again.';
      return Alert.alert('Could not open the camera', msg);
    }
    const uri = r.assets?.[0]?.uri;
    if (uri) setDraft({ ...draft, avatarUri: uri });
  };

  const changePhoto = () => {
    Alert.alert('Profile photo', undefined, [
      { text: 'Take a photo', onPress: takePhoto },
      { text: 'Choose from gallery', onPress: pickImage },
      ...(draft.avatarUri
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => setDraft({ ...draft, avatarUri: undefined }) }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const save = () => {
    const e: { name?: string; email?: string } = {};
    if (!draft.name.trim()) e.name = 'Full name is required.';
    if (!EMAIL_REGEX.test(norm(draft.email))) e.email = 'Enter a valid school email, e.g. name@tip.edu.ph.';
    setErrors(e);
    if (e.name || e.email) return;
    onSave({ ...draft, name: draft.name.trim(), email: norm(draft.email) });
  };

  const hasErrors = !!(errors.name || errors.email);

  return (
    <View style={s.fill}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={s.rowBetween}>
          <View style={s.rowCenter}>
            <BackButton onPress={requestClose} />
            <Text style={[s.header, { marginBottom: 0, marginLeft: 10, fontSize: 18 }]}>Edit Profile</Text>
          </View>
          <TouchableOpacity onPress={requestClose}><Text style={{ fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
        </View>
        <View style={[s.darkCard, { marginTop: 16, marginBottom: 20 }]}>
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
        <Field label="Full name" icon="👤" value={draft.name} onChangeText={set('name')} placeholder="Enter your full name" autoCapitalize="words" errorText={errors.name} />
        <Field label="School email" icon="✉️" value={draft.email} onChangeText={set('email')} keyboardType="email-address" errorText={errors.email} />
        <Field label="University" icon="🎓" value={draft.university} onChangeText={set('university')} autoCapitalize="words" />
        <ProgramSelect value={draft.program} onChange={set('program')} />
        <YearSelect value={draft.year} onChange={set('year')}/>
      </ScrollView>
      <View style={s.bottomBar}>
        <PrivacyNote text={hasErrors ? 'Check your name and school email. Demo only — no real profile changes are saved.' : undefined} />
        <PrimaryButton label="Save Changes" onPress={save} />
      </View>
      <DiscardModal visible={confirmDiscard} onKeep={() => setConfirmDiscard(false)} onDiscard={() => { setConfirmDiscard(false); onClose(); }} />
    </View>
  );
}
