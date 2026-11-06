import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { KeyboardScroll } from '../components/KeyboardAware';
import { s } from '../styles';
import { C } from '../theme';
import type { Board, User } from '../types';
import { fmtCount } from '../utils';
import { BoardDetail } from './BoardDetail';
import { CreatePost } from './CreatePost';
import { defaultDestination } from '../postTargets';
import { LineIcon } from '../components/LineIcon';
import { BoardBadge, BoardCard } from '../components/BoardCard';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { blurbOf, categoryOf } from '../boardCategories';
import { useAllBoards } from '../userBoards';
import { CreateBoard } from './CreateBoard';
import { useMembership } from '../membership';
import { useTabTarget } from '../navigation';
import { loadOrgBoards } from '../content';
import { OrgBoardsPage } from './OrgBoardsPage';

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
  const [creating, setCreating] = useState(false);
  const all = useAllBoards(); // built-in boards plus the ones students created
  const orgs = useMemo(() => loadOrgBoards(), []); // organization directory from src/content (academic / non-academic)
  const toast = useToast();
  const mem = useMembership(user?.email);
  // A search result on Home can open one board directly.
  useTabTarget('boards', (tg) => {
    const b = all.find((x) => x.id === tg.id);
    if (tg.kind === 'board' && b) { setComposing(false); setCreating(false); setOpen(b); }
  }, !embedded);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((b) =>
      (embedded ? mem.boards.includes(b.id) : !joinedOnly || mem.boards.includes(b.id)) &&
      (!q || nameOf(b).toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || categoryOf(b).toLowerCase().includes(q) || blurbOf(b).toLowerCase().includes(q)));
  }, [all, query, joinedOnly, embedded, mem.boards]);

  // "Your most active" = the joined board with the most new posts; before joining anything, show what's trending.
  const joined = all.filter((b) => mem.boards.includes(b.id));
  const pool = joined.length ? joined : all;
  const featured = [...pool].sort((a, b) => (b.newPosts ?? 0) - (a.newPosts ?? 0))[0];

  // Everyone who joined counts, including you (same number the board's own page shows).
  const countOf = (b: Board) => b.members + (mem.boards.includes(b.id) ? 1 : 0);

  // When the content has organizations, the main Boards page is the organization directory. Embedded copies (Profile) keep the joined-boards list.
  if (!embedded && orgs.length > 0) return <OrgBoardsPage orgs={orgs} />;

  if (creating) {
    return (
      <CreateBoard
        user={user}
        initialName={query.trim()}
        onBack={() => setCreating(false)}
        onCreated={(b) => {
          // Back to the list with every filter cleared so the new board is right at the top.
          setCreating(false); setQuery(''); setJoinedOnly(false); setTab('posts');
          toast.show(`“${b.name}” is live in Campus boards.`);
        }}
      />
    );
  }
  if (composing) return <CreatePost user={user} initial={defaultDestination({ tab: 'boards', boardId: featured?.id })} onClose={(r) => { setComposing(false); if (r) toast.show(`Posted to ${r.label}.`); }} />;
  if (open) return <BoardDetail board={open} user={user} onBack={() => setOpen(null)} embedded={embedded} />;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: C.dark }}>Campus boards</Text>
        <Text style={s.libSub}>Find your people, join the conversation</Text>
      </View>
      <TouchableOpacity
        accessibilityLabel="Create a post in a board"
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

  const createCta = (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => (user ? setCreating(true) : toast.error('Log in with your school account to create a board.'))}
      accessibilityRole="button"
      accessibilityLabel="Create a board"
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.yellow, borderRadius: 16, padding: 12, marginBottom: 14 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark, marginTop: -2 }}>+</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: C.dark }}>Create a board</Text>
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>Start a community for your org, hobby or class</Text>
      </View>
      <Text style={{ fontSize: 22, color: C.muted, marginTop: -2 }}>›</Text>
    </TouchableOpacity>
  );

  const hero = (
    <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(featured)}
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.dark, borderRadius: 18, padding: 18, marginBottom: 14 }}>
      <View style={{ marginRight: 14 }}><BoardBadge board={featured} size={56} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.yellow, marginBottom: 4 }}>
          {joined.length ? 'YOUR MOST ACTIVE' : 'TRENDING THIS WEEK'}
        </Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 3 }}>{nameOf(featured)}</Text>
        <Text style={{ fontSize: 12, color: '#D6D3C8' }}>{featured.sample ? `${featured.sampleLabel ?? '[Sample]'} · details not confirmed yet` : `${fmtCount(countOf(featured))} members · ${featured.newPosts ?? 0} new posts`}</Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: C.yellow }}>↗</Text>
    </TouchableOpacity>
  );

  const tabs = (
    <View style={[card, { flexDirection: 'row', padding: 3, marginBottom: 14, borderRadius: 14 }]}>
      {TABS.map((t) => {
        const on = tab === t.key;
        return (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, minHeight: 44, justifyContent: 'center', paddingVertical: 11, borderRadius: 11, alignItems: 'center', backgroundColor: on ? C.dark : 'transparent' }}>
            <Text style={{ fontSize: 13, fontWeight: on ? '800' : '600', color: on ? '#fff' : C.muted }}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const grid = (
    <View>
      {visible.map((b) => (
        <BoardCard key={b.id} board={b} members={countOf(b)} joined={mem.boards.includes(b.id)} onPress={() => setOpen(b)} />
      ))}
    </View>
  );

  const empty = visible.length === 0 && (
    embedded || !query
      ? <EmptyState icon="🧭" title="No boards yet" body="You haven’t joined any boards yet." />
      : <EmptyState icon="🔎" title="No boards match your search" body="Be the first to start it." actionLabel="Create a board" onAction={() => (user ? setCreating(true) : toast.error('Log in with your school account to create a board.'))} />
  );

  // Members tab: every board ranked by size, with how many people are online right now.
  const ranked = (
    <View style={[card, { overflow: 'hidden' }]}>
      {[...visible].sort((a, b) => countOf(b) - countOf(a)).map((b, i) => (
        <TouchableOpacity key={b.id} onPress={() => setOpen(b)} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
          <View style={{ marginRight: 12 }}><BoardBadge board={b} size={44} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.lbCardTitle}>{nameOf(b)}</Text>
            <Text style={s.lbCardMeta}>{b.sample ? `${b.sampleLabel ?? '[Sample]'} · details not confirmed yet` : `${fmtCount(countOf(b))} members · ${b.online ?? 0} online`}</Text>
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
          { icon: '👥', text: `${all.length} boards to explore` },
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
      {toast.node}
      {search}
      {createCta}
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
      <KeyboardScroll style={s.screen} showsVerticalScrollIndicator={false}>
        {body}
      </KeyboardScroll>
    );
  }
  return (
    <View style={s.screen}>
      {header}
      <KeyboardScroll style={s.fill} showsVerticalScrollIndicator={false}>
        {body}
      </KeyboardScroll>
    </View>
  );
}
