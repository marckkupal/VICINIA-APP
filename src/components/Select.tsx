import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';

// Simple inline dropdown: tap the box to expand the options below it.
export function Select({ icon, value, options, onChange }: { icon: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity style={s.lbSelect} activeOpacity={0.8} onPress={() => setOpen(!open)}>
        <Text style={s.fieldIcon}>{icon}</Text>
        <Text style={s.lbSelectText}>{value}</Text>
        <Text style={{ color: C.muted, fontSize: 12 }}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={s.lbOptions}>
          <ScrollView nestedScrollEnabled>
            {options.map((o) => (
              <TouchableOpacity key={o} style={s.lbOption} onPress={() => { onChange(o); setOpen(false); }}>
                <Text style={{ fontSize: 14, color: C.dark, fontWeight: o === value ? '800' : '400' }}>{o}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
