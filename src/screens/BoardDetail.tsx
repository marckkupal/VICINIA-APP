import { useState } from 'react';
import { Alert, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useToast } from '../components/Toast';
import { BackButton } from '../components/BackButton';
import { BOARD_DETAILS, fallbackDetail } from '../boardData';
import type { BoardPost } from '../boardData';
import { s } from '../styles';
import { C } from '../theme';
import type { Board, User } from '../types';
import { fmtCount } from '../utils';

type Tab = 'posts' | 'members' | 'about';
type Sort = 'latest' | 'popular' | 'following';
const TABS: { key: Tab; label: string }[] = [
  { key: 'posts', label: 'Posts' }, { key: 'members', label: 'Members' }, { key: 'about', label: 'About' },
];
const SORTS: { key: Sort; label: string }[] = [
  { key: 'latest', label: 'Latest' }, { key: 'popular', label: 'Popular' }, { key: 'following', label: 'Following' },
];
const AVATAR_BG = ['#F8E9E5', '#FDF1C4', '#E6E9F8', '#E3F0E4', '#EDE6F7'];
const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
const card = { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16 } as const;

function Av({ name, size = 36, i = 0 }: { name: string; size?: number; i?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_BG[i % AVATAR_BG.length], alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <Text style={{ fontSize: size * 0.3, fontWeight: '800', color: C.dark }}>{initials(name)}</Text>
    </View>
  );
}

function Pill({ children, onPress, active }: { children: string; onPress?: () => void; active?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ backgroundColor: active ? '#FDF1C4' : '#F3F1EA', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 }}>
      <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{children}</Text>
    </TouchableOpacity>
  );
}

function BoardPostCard({ p, idx, onToast }: { p: BoardPost; idx: number; onToast: (m: string) => void }) {
  const [vote, setVote] = useState<0 | 1 | -1>(0);
  const toggle = (v: 1 | -1) => setVote((cur) => (cur === v ? 0 : v));
  return (
    <View style={[card, { padding: 14, marginBottom: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Av name={p.author} i={idx} />
        <View style={{ flex: 1, marginLeft: -2 }}>
          <Text style={s.lbCardTitle}>{p.author}</Text>
          <Text style={[s.lbCardMeta, { marginTop: -2 }]}>{p.ago}</Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Post options" onPress={() => Alert.alert('Post options', undefined, [
          { text: 'Report', style: 'destructive', onPress: () => onToast('Reported (demo).') },
          { text: 'Cancel', style: 'cancel' },
        ])}>
          <Text style={{ color: C.muted, fontSize: 16 }}>···</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 14, color: C.dark, lineHeight: 21, marginBottom: 12 }}>{p.text}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F1EA', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 }}>
          <TouchableOpacity onPress={() => toggle(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 13, color: vote === 1 ? C.orange : C.dark }}>↑</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, fontWeight: '800', color: vote === 1 ? C.orange : C.dark, marginHorizontal: 8 }}>{p.votes + vote}</Text>
          <TouchableOpacity onPress={() => toggle(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 13, color: vote === -1 ? '#4A6CD9' : C.dark }}>↓</Text>
          </TouchableOpacity>
        </View>
        <Pill onPress={() => onToast('Replies are a demo preview.')}>{`💬 ${p.replies} replies`}</Pill>
        <Pill onPress={() => Share.share({ message: p.text }).catch(() => onToast('Could not share.'))}>↗ Share</Pill>
      </View>
    </View>
  );
}

export function BoardDetail({ board, user, onBack }: { board: Board; user?: User; onBack: () => void }) {
  const d = BOARD_DETAILS[board.id] ?? fallbackDetail(board.name);
  const [tab, setTab] = useState<Tab>('posts');
  const [sort, setSort] = useState<Sort>('latest');
  const [joined, setJoined] = useState(false);
  const members = board.members + (joined ? 1 : 0);
  const me = initials(user?.name ?? 'Juan Dela Cruz');
  const feed = sort === 'following' ? [] : sort === 'popular' ? [...d.feed].sort((a, b) => b.votes - a.votes) : d.feed;
  const toast = useToast();
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [mine, setMine] = useState<BoardPost[]>([]);
  const soon = () => setComposing(true);
  const publish = () => {
    if (!draft.trim()) return toast.show('Write something first.');
    setMine((m) => [{ id: `me-${Date.now()}`, author: user?.name ?? 'You', ago: 'just now', text: draft.trim(), votes: 0, replies: 0 }, ...m]);
    setDraft('');
    setComposing(false);
    toast.show('Posted to this board (demo, local only).');
  };

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.lbHeaderTitle}>{board.name}</Text>
          <Text style={s.libSub}>{fmtCount(members)} members · {d.posts} posts</Text>
        </View>
        <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }} onPress={soon} accessibilityLabel="New post">
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark, marginTop: -2 }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.dark, borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 22 }}>{board.emoji}</Text>
        </View>
        <View style={{ flex: 1, marginRight: 10 }}>
          {d.showTitle && <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 3 }}>{board.name}</Text>}
          <Text style={{ color: '#E8E4D8', fontSize: 11, lineHeight: 16 }}>{d.description}</Text>
        </View>
        <TouchableOpacity onPress={() => setJoined((j) => !j)} style={{ backgroundColor: joined ? '#fff' : C.yellow, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: C.dark }}>{joined ? (d.joinLabel ? 'JOINED' : 'Joined') : (d.joinLabel ?? 'Join Community')}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
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

      {tab === 'posts' && (
        <>
          <View style={s.lbChipRow}>
            {SORTS.map((f) => {
              const on = sort === f.key;
              return (
                <TouchableOpacity key={f.key} style={[s.lbChip, on && s.lbChipOn]} onPress={() => setSort(f.key)}>
                  <Text style={[s.lbChipText, on && s.lbChipTextOn]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={soon} style={[card, { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 12, borderRadius: 14 }]}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: C.dark }}>{me}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: C.muted }}>Share something with the board…</Text>
            <Text style={{ fontSize: 16, color: C.green }}>🖼️</Text>
          </TouchableOpacity>
          {composing && (
            <View style={[card, { padding: 12, marginBottom: 12 }]}>
              <TextInput value={draft} onChangeText={setDraft} multiline autoFocus placeholder="Share something with the board…" placeholderTextColor="#A5A296" style={{ minHeight: 70, fontSize: 14, color: C.dark }} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <Pill onPress={() => { setComposing(false); setDraft(''); }}>Cancel</Pill>
                <Pill onPress={publish} active>Post</Pill>
              </View>
            </View>
          )}
          {sort !== 'following' && mine.map((p, i) => <BoardPostCard key={p.id} p={p} idx={i} onToast={toast.show} />)}
          {feed.map((p, i) => <BoardPostCard key={p.id} p={p} idx={i + mine.length} onToast={toast.show} />)}
          {toast.node}
          {feed.length === 0 && (
            <Text style={[s.muted, { fontSize: 13, marginBottom: 14 }]}>
              {sort === 'following' ? 'Follow members to see their posts here.' : 'No posts in this demo board yet.'}
            </Text>
          )}
        </>
      )}

      {tab === 'members' && (
        <View style={[card, { overflow: 'hidden' }]}>
          {d.members.map((m, i) => (
            <View key={m.name} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
              <Av name={m.name} size={44} i={i} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.dark }}>{m.name}</Text>
                <Text style={s.lbCardMeta}>{m.role}</Text>
              </View>
              {m.role !== 'Member' && (
                <View style={{ backgroundColor: m.role === 'Admin' ? C.dark : C.yellow, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 0.5, color: m.role === 'Admin' ? '#fff' : C.dark }}>{m.role === 'Admin' ? 'ADMIN' : 'MOD'}</Text>
                </View>
              )}
            </View>
          ))}
          {d.members.length === 0 && <Text style={[s.muted, { fontSize: 13, padding: 14 }]}>Member list isn’t loaded in this demo.</Text>}
        </View>
      )}

      {tab === 'about' && (
        <>
          <View style={[card, { padding: 16, marginBottom: 12 }]}>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.muted, marginBottom: 10 }}>DESCRIPTION</Text>
            <Text style={{ fontSize: 16, color: C.dark, lineHeight: 24 }}>{d.description}</Text>
          </View>
          <View style={[card, { paddingHorizontal: 16 }]}>
            {[
              { icon: '👥', text: `${fmtCount(members)} members` },
              { icon: '📝', text: `${d.posts} total posts` },
              { icon: '📍', text: 'TIP Quezon City Campus' },
              { icon: '🏫', text: 'Open to all TIP QC students' },
            ].map((r, i) => (
              <View key={r.text} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
                <Text style={{ fontSize: 15, width: 30 }}>{r.icon}</Text>
                <Text style={{ fontSize: 15, color: C.dark }}>{r.text}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
