import { TouchableOpacity, View } from 'react-native';
import { C } from '../theme';

// Switch used by the settings screens. `disabled` ignores taps and dims it (e.g. while a change is being saved).
export function Toggle({ on, onPress, disabled }: { on: boolean; onPress?: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled: !!disabled }}
      style={{ opacity: disabled ? 0.5 : 1, width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center', backgroundColor: on ? C.yellow : '#E3E0D6' }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: on ? 'flex-end' : 'flex-start' }} />
    </TouchableOpacity>
  );
}
