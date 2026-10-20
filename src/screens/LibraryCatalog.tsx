import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { LibPage } from '../components/LibPage';
import { PrivacyNote } from '../components/PrivacyNote';
import { LIB_RESOURCES } from '../data';
import type { LibKind, LibResource } from '../data';
import { s } from '../styles';
import { C } from '../theme';

type Filter = 'all' | LibKind;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'book', label: 'Books' },
  { key: 'eresource', label: 'E-resources' },
];

export function LibraryCatalog({ initialQuery, campus, onBack, onOpen }: { initialQuery: string; campus: string; onBack: () => void; onOpen: (r: LibResource) => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>('all');

  const q = query.trim().toLowerCase();
  const results = LIB_RESOURCES.filter((r) => {
    if (filter !== 'all' && r.kind !== filter) return false;
    if (!q) return true;
    return `${r.title} ${r.byline} ${r.meta} ${r.keywords}`.toLowerCase().includes(q);
  });

  return (
    <LibPage title="Library catalog" sub={`Main Library · ${campus}`} onBack={onBack}>
      <View style={s.lbSearch}>
        <Text style={{ marginRight: 10, color: C.muted }}>🔍</Text>
        <TextInput
          style={{ flex: 1, fontSize: 14, color: C.dark }}
          placeholder="Search the library catalog"
          placeholderTextColor="#A5A296"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ fontSize: 16, color: C.muted }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.lbChipRow}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <TouchableOpacity key={f.key} style={[s.lbChip, on && s.lbChipOn]} onPress={() => setFilter(f.key)}>
              <Text style={[s.lbChipText, on && s.lbChipTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.lbCount}>{results.length} {results.length === 1 ? 'resource' : 'resources'}</Text>

      {results.length === 0 && (
        <Text style={[s.muted, { fontSize: 13, marginBottom: 14 }]}>No sample resources match “{query.trim()}”. Try a different search or filter.</Text>
      )}

      {results.map((r) => (
        <View key={r.id}>
          <TouchableOpacity style={s.lbCard} activeOpacity={0.8} onPress={() => onOpen(r)}>
            <View style={[s.lbCardIcon, { backgroundColor: r.bg }]}><Text style={{ fontSize: 22 }}>{r.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.lbCardTitle}>{r.title}</Text>
              <Text style={s.lbCardMeta}>{r.byline}</Text>
              <Text style={s.lbCardMeta}>{r.meta}</Text>
            </View>
            <Text style={s.menuChevron}>›</Text>
          </TouchableOpacity>
          <Text style={[s.lbCaption, r.availMuted && s.lbCaptionMuted]}>{r.avail}</Text>
        </View>
      ))}

      <PrivacyNote text="Sample catalog and availability only. Check with the library desk for actual holdings and access." />
    </LibPage>
  );
}
