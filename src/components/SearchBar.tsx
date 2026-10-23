import { View, TextInput } from 'react-native';
import { s } from '../styles';
import { LineIcon } from './LineIcon';
import { C } from '../theme';

export function SearchBar({ placeholder = 'Search places, events, communities', value, onChangeText }: { filter?: boolean; /* ignored: the filter icon was removed */ placeholder?: string; value?: string; onChangeText?: (t: string) => void }) {
  return (
    <View style={s.searchBar}>
      <View style={{ marginRight: 12 }}><LineIcon name="search" size={22} color={C.muted} /></View>
      <TextInput style={{ flex: 1, fontSize: 15, color: C.dark }} placeholder={placeholder} value={value} onChangeText={onChangeText} placeholderTextColor="#A5A296" />
    </View>
  );
}
