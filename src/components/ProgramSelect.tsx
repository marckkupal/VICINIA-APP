import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PROGRAMS, programCode } from '../data';
import { s } from '../styles';
import { C } from '../theme';

// Dropdown of the available academic programs: abbreviation in bold, full name beneath.
export function ProgramSelect({ value, onChange, errorText }: { value: string; onChange: (code: string) => void; errorText?: string }) {
  const [open, setOpen] = useState(false);
  const code = programCode(value);
  const current = PROGRAMS.find((p) => p.code === code);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.fieldLabel}>Program</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel="Select academic program"
        style={[s.fieldBox, { height: current ? 56 : 48 }, !!errorText && { borderColor: C.error }, open && { borderColor: C.yellow }]}
      >
        <Text style={s.fieldIcon}>🎓</Text>
        <View style={{ flex: 1 }}>
          {current ? (
            <>
              <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark }}>{current.code}</Text>
              <Text style={{ fontSize: 11, color: C.muted }} numberOfLines={1}>{current.name}</Text>
            </>
          ) : (
            <Text style={{ fontSize: 14, color: value ? C.dark : '#A5A296' }}>{value || 'Select your program'}</Text>
          )}
        </View>
        <Text style={{ color: C.muted, fontSize: 12 }}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 14, marginTop: 6, overflow: 'hidden' }}>
          {PROGRAMS.map((p, i) => {
            const on = p.code === code;
            return (
              <TouchableOpacity
                key={p.code}
                activeOpacity={0.7}
                onPress={() => { onChange(p.code); setOpen(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.border, backgroundColor: on ? '#FDF8E6' : '#fff' }}
              >
                <View style={{ width: 58, marginRight: 10, backgroundColor: on ? C.yellow : '#F3F1EA', borderRadius: 8, paddingVertical: 5, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: C.dark }}>{p.code}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: C.dark, fontWeight: on ? '800' : '400', lineHeight: 18 }}>{p.name}</Text>
                {on && <Text style={{ color: C.green, fontSize: 15, marginLeft: 8 }}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {!!errorText && <Text style={s.fieldErrorText}>{errorText}</Text>}
    </View>
  );
}
