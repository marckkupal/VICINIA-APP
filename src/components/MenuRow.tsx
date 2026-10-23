import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { s } from '../styles';

export function MenuRow({ icon, tint, label, value, last, onPress }: { icon: ReactNode; tint: string; label: string; value?: string; last?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[s.menuRow, !last && { marginBottom: 14 }]} activeOpacity={0.7} onPress={onPress}>
      <View style={[s.menuIcon, { backgroundColor: tint }]}>{typeof icon === 'string' ? <Text style={{ fontSize: 16 }}>{icon}</Text> : icon}</View>
      <Text style={s.menuLabel}>{label}</Text>
      {!!value && <Text style={s.menuValue}>{value}</Text>}
      <Text style={s.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}
