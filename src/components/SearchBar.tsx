import { View, Text, TextInput } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';

export function SearchBar({ filter, placeholder = 'Search places, events, communities', value, onChangeText }: { filter?: boolean; placeholder?: string; value?: string; onChangeText?: (t: string) => void }) {
  return (
    <View style={s.searchBar}>
      <Text style={{ marginRight: 10, color: C.muted }}>🔍</Text>
      <TextInput style={{ flex: 1, fontSize: 14, color: C.dark }} placeholder={placeholder} value={value} onChangeText={onChangeText} placeholderTextColor="#A5A296" />
      {filter && <Text style={{ fontSize: 16 }}>🎚️</Text>}
    </View>
  );
}
