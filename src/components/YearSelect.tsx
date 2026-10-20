import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { YEARS } from '../data';
import { s } from '../styles';
import { C } from '../theme';

export function YearSelect({ value, onChange, errorText }: { value: string; onChange: (v: string) => void; errorText?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.fieldLabel}>Year</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel="Select year level"
        style={[s.fieldBox, !!errorText && { borderColor: C.error }, open && { borderColor: C.yellow }]}
      >
        <Text style={s.fieldIcon}>📅</Text>
        <Text style={{ flex: 1, fontSize: 14, color: value ? C.dark : '#A5A296' }}>{value || 'Select your year'}</Text>
        <Text style={{ color: C.muted, fontSize: 12 }}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 14, marginTop: 6, overflow: 'hidden' }}>
          {YEARS.map((y, i) => {
            const on = y === value;
            return (
              <TouchableOpacity
                key={y}
                activeOpacity={0.7}
                onPress={() => { onChange(y); setOpen(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderTopColor: C.border, backgroundColor: on ? '#FDF8E6' : '#fff' }}
              >
                <Text style={{ flex: 1, fontSize: 14, color: C.dark, fontWeight: on ? '800' : '400' }}>{y}</Text>
                {on && <Text style={{ color: C.green, fontSize: 15 }}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {!!errorText && <Text style={s.fieldErrorText}>{errorText}</Text>}
    </View>
  );
}
