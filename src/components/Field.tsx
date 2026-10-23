import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EmojiIcon, ProfileIcon } from './ProfileIcon';
import { s } from '../styles';
import { C } from '../theme';

export function Field({
  label, icon, value, onChangeText, placeholder, secure, error, keyboardType, autoCapitalize = 'none', half, errorText, helper, multiline, maxLength,
}: {
  label: string; icon?: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  secure?: boolean; error?: boolean; keyboardType?: any; autoCapitalize?: any; half?: boolean;
  errorText?: string; helper?: string; multiline?: boolean; maxLength?: number;
}) {
  // Password text is masked by default.
  const [hidden, setHidden] = useState(true);

  // Visibility lives in this component's state, so it is already reset to hidden whenever the
  // screen or modal that renders the field is closed (the field unmounts). We also re-hide it
  // if the app is sent to the background, so a revealed password is never left on screen.
  useEffect(() => {
    if (!secure) return undefined;
    setHidden(true);
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setHidden(true);
    });
    return () => sub.remove();
  }, [secure]);

  const masked = !!secure && hidden;

  return (
    <View style={[styles.wrap, half && styles.half]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldBox, multiline && styles.multilineBox, (error || !!errorText) && styles.errorBorder]}>
        {!!icon && <View style={{ marginRight: 12 }}><EmojiIcon glyph={icon} /></View>}
        <TextInput
          // Remount on toggle: on Android, flipping secureTextEntry in place can leave the text unmasked.
          key={masked ? 'masked' : 'plain'}
          style={[s.fieldInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A5A296"
          secureTextEntry={masked}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
        />
        {!!secure && (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            style={styles.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={masked ? 'Show password' : 'Hide password'}
          >
            <ProfileIcon name={masked ? 'eyeOff' : 'eye'} size={22} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>
      {errorText ? <Text style={s.fieldErrorText}>{errorText}</Text> : helper ? <Text style={s.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  half: { flex: 1 },
  multilineBox: { height: 120, alignItems: 'flex-start', paddingTop: 12 },
  multilineInput: { height: '100%', textAlignVertical: 'top' },
  errorBorder: { borderColor: C.error },
  eyeBtn: { marginLeft: 8, padding: 2 },
});
