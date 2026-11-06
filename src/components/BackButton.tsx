import { Text, TouchableOpacity } from 'react-native';
import { s } from '../styles';

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
      <Text style={s.backArrow}>‹</Text>
    </TouchableOpacity>
  );
}
