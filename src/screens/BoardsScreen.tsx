import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { BOARDS } from '../data';
import { s } from '../styles';
import { C } from '../theme';
import type { Board, User } from '../types';
import { fmtCount } from '../utils';
import { BoardDetail } from './BoardDetail';
import { CreatePost } from './CreatePost';
import { LineIcon } from '../components/LineIcon';
import { useMembership } from '../membership';

type Tab = 'posts' | 'members' | 'about';
const TABS: { key: Tab; label: string }[] = [
  { key: 'posts', label: 'Posts' }, { key: 'members', label: 'Members' }, { key: 'about', label: 'About' },
];
const card = { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16 } as const;
const nameOf = (b: Board) => b.label ?? b.name;

export function BoardsScreen({ user, embedded }: { user?: User; embedded?: boolean }) {
  const [open, setOpen] = useState<Board | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [query, setQuery] = useState('');
  const [joinedOnly, setJoinedOnly] = useState(false);
  const [composing, setComposing] = useState(false);
  const mem = useMembership(user?.email);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BOARDS.filter((b) =>
      (embedded ? mem.boards.includes(b.id) : !joinedOnly || mem.boards.includes(b.id)) &&
      (!q || nameOf(b).toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || (b.tagline ?? '').toLowerCase().includes(q)));
  }, [query, joinedOnly, embedded, mem.boards]);

  // "Your most active" = the joined board with the most new posts; before joining anything, show what's trending.
  const joined = BOARDS.filter((b) => mem.boards.includes(b.id));
  const pool = joined.length ? joined : BOARDS;
  const featured = [...pool].sort((a, b) => (b.newPosts ?? 0) - (a.newPosts ?? 0))[0];

  if (composing) return <CreatePost board={featured} user={user} onClose={() => setComposing(false)} />;
  if (open) return <BoardDetail board={open} user={user} onBack={() => setOpen(null)} embedded={embedded} />;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: C.dark }}>Campus boards</Text>
        <Text style={s.libSub}>Find your people, join the conversation</Text>
      </View>
      <TouchableOpacity
        accessibilityLabel="Create a post"
        onPress={() => setComposing(true)}
        style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: C.dark, marginTop: -2 }}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const search = (
    <View style={[s.lbSearch, { marginBottom: 14 }]}>
      <View style={{ marginRight: 10 }}><LineIcon name="search" size={20} color={C.muted} /></View>
      <TextInput
        value={query} onChangeText={setQuery} placeholder="Search boards" placeholderTextColor="#A5A296"
        style={{ flex: 1, fontSize: 14, color: C.dark }} returnKeyType="search" />
      <TouchableOpacity
        accessibilityLabel={joinedOnly ? 'Show all boards' : 'Show only boards I joined'}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        onPress={() => setJoinedOnly((v) => !v)}
        style={{ padding: 4, borderRadius: 8, backgroundColor: joinedOnly ? '#FDF1C4' : 'transparent' }}>
        <LineIcon name="sliders" size={20} color={joinedOnly ? C.dark : C.muted} />
      </TouchableOpacity>
    </View>
  );

  const hero = (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(featured)}
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.dark, borderRadius: 18, padding: 18, marginBottom: 14 }}>
      <Text style={{ fontSize: 40, marginRight: 14 }}>{featured.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.yellow, marginBottom: 4 }}>
          {joined.length ? 'YOUR MOST ACTIVE' : 'TRENDING THIS WEEK'}
        </Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 3 }}>{nameOf(featured)}</Text>
        <Text style={{ fontSize: 12, color: '#D6D3C8' }}>{fmtCount(featured.members)} members · {featured.newPosts ?? 0} new posts</Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: C.yellow }}>↗</Text>
    </TouchableOpacity>
  );

  const tabs = (
    <View style={[card, { flexDirection: 'row', padding: 3, marginBottom: 14, borderRadius: 14 }]}>
      {TABS.map((t) => {
        const on = tab === t.key;
        return (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center', backgroundColor: on ? C.dark : 'transparent' }}>
            <Text style={{ fontSize: 13, fontWeight: on ? '800' : '600', color: on ? '#fff' : C.muted }}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const grid = (
    <View style={s.grid}>
      {visible.map((b) => (
        <TouchableOpacity key={b.id} activeOpacity={0.85} onPress={() => setOpen(b)}
          style={{ width: '48%', minHeight: 112, backgroundColor: b.tint ?? '#fff', borderRadius: 18, padding: 14, marginBottom: 12, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: C.muted }}>{fmtCount(b.members)}</Text>
          </View>
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: C.dark }}>{nameOf(b)}</Text>
            {!!b.tagline && <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }} numberOfLines={1}>{b.tagline}</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const empty = visible.length === 0 && (
    <Text style={[s.muted, { textAlign: 'center', marginTop: 24, fontSize: 13 }]}>
      {embedded ? 'You haven’t joined any boards yet.' : query ? 'No boards match your search.' : 'You haven’t joined any boards yet.'}
    </Text>
  );

  // Members tab: every board ranked by size, with how many people are online right now.
  const ranked = (
    <View style={[card, { overflow: 'hidden' }]}>
      {[...visible].sort((a, b) => b.members - a.members).map((b, i) => (
        <TouchableOpacity key={b.id} onPress={() => setOpen(b)} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: b.tint ?? '#F3F1EA', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.lbCardTitle}>{nameOf(b)}</Text>
            <Text style={s.lbCardMeta}>{fmtCount(b.members)} members · {b.online ?? 0} online</Text>
          </View>
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const about = (
    <>
      <View style={[card, { padding: 16, marginBottom: 12 }]}>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.muted, marginBottom: 10 }}>ABOUT CAMPUS BOARDS</Text>
        <Text style={{ fontSize: 15, color: C.dark, lineHeight: 23 }}>
          Boards are communities for TIP QC students who share an interest. Join one to post, reply, and meet people beyond your class.
        </Text>
      </View>
      <View style={[card, { paddingHorizontal: 16 }]}>
        {[
          { icon: '👥', text: `${BOARDS.length} boards to explore` },
          { icon: '✅', text: `${joined.length} joined` },
          { icon: '📍', text: 'TIP Quezon City Campus' },
        ].map((r, i) => (
          <View key={r.text} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
            <Text style={{ fontSize: 15, width: 30 }}>{r.icon}</Text>
            <Text style={{ fontSize: 15, color: C.dark }}>{r.text}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const body = embedded ? (
    <>{grid}{empty}<View style={{ height: 24 }} /></>
  ) : (
    <>
      {search}
      {hero}
      {tabs}
      {tab === 'posts' && <>{grid}{empty}</>}
      {tab === 'members' && <>{ranked}{empty}</>}
      {tab === 'about' && about}
      <View style={{ height: 24 }} />
    </>
  );

  // Embedded inside another scrolling page (e.g. LibPage) keep one scroll view and skip the page header.
  if (embedded) {
    return (
      <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
        {body}
      </ScrollView>
    );
  }
  return (
    <View style={s.screen}>
      {header}
      <ScrollView style={s.fill} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {body}
      </ScrollView>
    </View>
  );
}
