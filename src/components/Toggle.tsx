import { TouchableOpacity, View } from 'react-native';
import { C } from '../theme';

// Static-look switch used by the demo settings screens.
export function Toggle({ on, onPress }: { on: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={{ width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center', backgroundColor: on ? C.yellow : '#E3E0D6' }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: on ? 'flex-end' : 'flex-start' }} />
    </TouchableOpacity>
  );
}
