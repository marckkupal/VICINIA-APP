import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';

// `busy` shows an inline spinner and ignores further taps (prevents double submits); `disabled` just ignores taps.
export function PrimaryButton({ label, onPress, dark, busy, disabled }: { label: string; onPress: () => void; dark?: boolean; busy?: boolean; disabled?: boolean }) {
  const off = !!busy || !!disabled;
  return (
    <TouchableOpacity
      onPress={off ? undefined : onPress}
      activeOpacity={off ? 1 : 0.8}
      style={[s.primaryBtn, dark && { backgroundColor: C.dark }, off && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: !!busy }}
    >
      {busy
        ? <ActivityIndicator color={dark ? '#fff' : C.dark} accessibilityLabel="Loading" />
        : <Text style={[s.primaryBtnText, dark && { color: '#fff' }]}>{label}</Text>}
    </TouchableOpacity>
  );
}
