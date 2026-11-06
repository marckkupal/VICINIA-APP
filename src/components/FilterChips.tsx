import { ScrollView, Text, TouchableOpacity } from 'react-native';
import type { Option } from '../content/filters';
import { C } from '../theme';

// One row of tappable filter chips ("Academic · 6"). Options come from content/filters.ts, so every chip has data behind it.
// Tapping the selected chip again clears it when `clearable` (used for tags); otherwise it stays selected (used for All / category / status).
export function FilterChips<K extends string>({ options, value, onChange, label, clearable, emptyKey }: {
  options: Option<K>[]; value: K | null; onChange: (k: K | null) => void; label: string; clearable?: boolean; emptyKey?: K;
}) {
  if (!options.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={label} style={{ marginBottom: 10, flexGrow: 0 }}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <TouchableOpacity
            key={o.key} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ selected: on }}
            accessibilityLabel={`${o.label}, ${o.count} ${o.count === 1 ? 'item' : 'items'}${on ? ', selected' : ''}`}
            onPress={() => onChange(on && clearable ? null : o.key)}
            style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, marginRight: 8, borderWidth: 1, borderColor: on ? C.dark : C.border, backgroundColor: on ? C.dark : '#fff', opacity: o.count === 0 && !on ? 0.55 : 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: on ? '#fff' : C.dark }}>{o.label} · {o.count}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
