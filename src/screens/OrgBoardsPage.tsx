import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { loadOrgBoards, type OrgBoard } from '../content';
import { filterOrgs, groupOptions, GROUP_LABEL, GROUP_ORDER, NO_ORG_FILTER, orgEmptyFor, reconcileOrgFilter, tagOptions, type GroupFilter, type OrgFilter } from '../content/filters';
import { FilterChips } from '../components/FilterChips';
import { OrgBoardCard } from '../components/OrgBoardCard';
import { OrgDetailModal } from '../components/OrgDetailModal';
import { s } from '../styles';
import { C } from '../theme';
import { useNow } from '../useNow';

// Boards page: the organization directory. Filters (Academic / Non-academic, tags) are built from the loaded organizations.
export function OrgBoardsPage({ orgs }: { orgs?: OrgBoard[] }) {
  const list = useMemo(() => orgs ?? loadOrgBoards(), [orgs]);
  const [open, setOpen] = useState<OrgBoard | null>(null);
  const [raw, setRaw] = useState<OrgFilter>(NO_ORG_FILTER);
  const now = useNow();
  const filter = reconcileOrgFilter(list, raw); // a tag that is not in the data (any more) is dropped, never left hiding everything
  const shown = filterOrgs(list, filter);
  const empty = orgEmptyFor(list, filter);
  const tags = tagOptions(list, filter.group);
  const sections = GROUP_ORDER.map((g) => ({ g, items: shown.filter((o) => o.group === g) })).filter((x) => x.items.length > 0);
  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: C.dark }}>Campus boards</Text>
        <Text style={[s.libSub, { marginBottom: 14 }]}>Student organizations at TIP Quezon City</Text>
        {list.length > 0 && (
          <>
            <FilterChips label="Filter by category" options={groupOptions(list)} value={filter.group} onChange={(k) => setRaw({ group: (k ?? 'all') as GroupFilter, tag: filter.tag })} />
            <FilterChips label="Filter by tag" options={tags} value={filter.tag ? filter.tag.trim().toLowerCase() : null} clearable onChange={(k) => setRaw({ group: filter.group, tag: k })} />
          </>
        )}
        {empty && (
          <View accessibilityRole="summary" style={{ alignItems: 'center', padding: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: C.dark }}>{empty.title}</Text>
            <Text style={{ fontSize: 13, color: C.muted, marginTop: 4, textAlign: 'center' }}>{empty.body}</Text>
            {empty.canClear && (
              <TouchableOpacity onPress={() => setRaw(NO_ORG_FILTER)} accessibilityRole="button" accessibilityLabel="Clear filters" style={{ minHeight: 44, justifyContent: 'center', marginTop: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: C.dark, textDecorationLine: 'underline' }}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {sections.map(({ g, items }) => (
          <View key={g}>
            <Text accessibilityRole="header" style={{ fontSize: 12, fontWeight: '900', letterSpacing: 1, color: C.muted, marginBottom: 10, marginTop: 4 }}>
              {GROUP_LABEL[g].toUpperCase()} · {items.length}
            </Text>
            {items.map((o) => <OrgBoardCard key={o.id} org={o} now={now} onPress={() => setOpen(o)} />)}
          </View>
        ))}
      </ScrollView>
      <OrgDetailModal org={open} now={now} onClose={() => setOpen(null)} />
    </View>
  );
}
