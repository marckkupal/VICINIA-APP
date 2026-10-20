import { View, Text, TouchableOpacity } from 'react-native';
import { s } from '../styles';

export function MenuRow({ icon, tint, label, value, last, onPress }: { icon: string; tint: string; label: string; value?: string; last?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[s.menuRow, !last && { marginBottom: 14 }]} activeOpacity={0.7} onPress={onPress}>
      <View style={[s.menuIcon, { backgroundColor: tint }]}><Text style={{ fontSize: 16 }}>{icon}</Text></View>
      <Text style={s.menuLabel}>{label}</Text>
      {!!value && <Text style={s.menuValue}>{value}</Text>}
      <Text style={s.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}
