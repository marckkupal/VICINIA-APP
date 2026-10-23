import { useState } from 'react';
import type { ReactNode } from 'react';
import { Image, Linking, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useToast } from '../components/Toast';
import { LineIcon } from '../components/LineIcon';
import { usePopup } from '../components/Popup';
import { BOARD_DETAILS, fallbackDetail } from '../boardData';
import type { BoardPost } from '../boardData';
import { s } from '../styles';
import { C } from '../theme';
import type { Board, User } from '../types';
import { fmtCount } from '../utils';
import { toggleBoard, useMembership } from '../membership';
import { useBoardPosts } from '../boardPosts';
import { CreatePost } from './CreatePost';

type Tab = 'posts' | 'members' | 'about';
type Sort = 'latest' | 'popular' | 'following';
const TABS: { key: Tab; label: string }[] = [
  { key: 'posts', label: 'Posts' }, { key: 'members', label: 'Members' }, { key: 'about', label: 'About' },
];
const SORTS: { key: Sort; label: string }[] = [
  { key: 'latest', label: 'Latest' }, { key: 'popular', label: 'Popular' }, { key: 'following', label: 'Following' },
];
const AVATAR_BG = ['#F7C84B', '#E6E9F8', '#E3F0E4', '#F8E9E5', '#EDE6F7'];
const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
const card = { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16 } as const;

function Av({ name, size = 36, i = 0 }: { name: string; size?: number; i?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_BG[i % AVATAR_BG.length], alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <Text style={{ fontSize: size * 0.3, fontWeight: '800', color: C.dark }}>{initials(name)}</Text>
    </View>
  );
}

function Pill({ children, onPress, active }: { children: ReactNode; onPress?: () => void; active?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ backgroundColor: active ? '#FDF1C4' : '#F3F1EA', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 }}>
      {typeof children === 'string' ? <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{children}</Text> : children}
    </TouchableOpacity>
  );
}

// Small green "photo" glyph for the composer row (plain Views, like LineIcon).
function PhotoIcon({ size = 20, color = C.green }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 4, borderWidth: 1.6, borderColor: color, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: size * 0.14, right: size * 0.18, width: size * 0.2, height: size * 0.2, borderRadius: size, backgroundColor: color }} />
      <View style={{ position: 'absolute', bottom: -size * 0.24, left: size * 0.06, width: size * 0.5, height: size * 0.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

// Renders **bold** and _italic_ typed in the Create post screen.
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean);
  return (
    <Text style={{ fontSize: 14, color: C.dark, lineHeight: 21 }}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <Text key={i} style={{ fontWeight: '800' }}>{part.slice(2, -2)}</Text>
        : part.startsWith('_') && part.endsWith('_') && part.length > 2 ? <Text key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>
        : part)}
    </Text>
  );
}

type Comment = { id: string; author: string; text: string; ago: string };

function BoardPostCard({ p, idx, me, onToast }: { p: BoardPost; idx: number; me: string; onToast: (m: string) => void }) {
  const [liked, setLiked] = useState(false);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const popup = usePopup();
  const REASONS = ['Spam or advertising', 'Harassment or bullying', 'Off-topic for this board', 'Something else'];
  const chooseReason = () => popup.show({
    icon: '🚩', iconBg: C.errorBg,
    title: 'Why are you reporting this?',
    body: 'Your report is anonymous. Board moderators will review the post.',
    actions: [
      ...REASONS.map((r) => ({ text: r, style: 'secondary' as const, onPress: () => onToast('Thanks, your report was sent (demo).') })),
      { text: 'Cancel', style: 'secondary' as const },
    ],
  });
  const postOptions = () => popup.show({
    icon: '⋯', iconBg: '#F3F1EA',
    title: 'Post options',
    body: `By ${p.author} · ${p.ago}`,
    actions: [
      { text: 'Share post', style: 'secondary', onPress: () => Share.share({ message: [p.title, p.text, p.link].filter(Boolean).join('\n') }).catch(() => onToast('Could not share.')) },
      { text: 'Report post', style: 'danger', onPress: chooseReason },
      { text: 'Cancel', style: 'secondary' },
    ],
  });
  const send = () => {
    if (!text.trim()) return onToast('Write a reply first.');
    setComments((c) => [...c, { id: `c-${Date.now()}`, author: me, text: text.trim(), ago: 'just now' }]);
    setText('');
  };
  return (
    <View style={[card, { padding: 14, marginBottom: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Av name={p.author} i={idx} />
        <View style={{ flex: 1, marginLeft: -2 }}>
          <Text style={s.lbCardTitle}>{p.author}</Text>
          <Text style={[s.lbCardMeta, { marginTop: -2 }]}>{p.ago}</Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Post options" onPress={postOptions}>
          <Text style={{ color: C.muted, fontSize: 16 }}>···</Text>
        </TouchableOpacity>
      </View>
      {!!p.flair && (
        <View style={{ alignSelf: 'flex-start', backgroundColor: '#FDF1C4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: C.dark }}>{p.flair}</Text>
        </View>
      )}
      {!!p.title && <Text style={{ fontSize: 16, fontWeight: '900', color: C.dark, marginBottom: 6 }}>{p.title}</Text>}
      {!!p.text && <View style={{ marginBottom: 12 }}><RichText text={p.text} /></View>}
      {!!p.media?.length && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {p.media.map((m, i) => (
            <View key={m.uri} style={{ width: p.media!.length === 1 ? '100%' : '49%', height: p.media!.length === 1 ? 200 : 120, marginRight: p.media!.length > 1 && i % 2 === 0 ? '2%' : 0, marginBottom: 6, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1F1F1F', alignItems: 'center', justifyContent: 'center' }}>
              {m.type === 'photo' ? <Image source={{ uri: m.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>▶ Video</Text>}
            </View>
          ))}
        </View>
      )}
      {!!p.link && (
        <TouchableOpacity onPress={() => Linking.openURL(p.link!).catch(() => onToast('Could not open the link.'))} style={{ backgroundColor: '#E6EDFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#3D5FC4' }} numberOfLines={1}>🔗 {p.link}</Text>
        </TouchableOpacity>
      )}
      {!p.title && !p.text ? null : <View style={{ height: p.title && !p.text && !p.link ? 6 : 0 }} />}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => setLiked((v) => !v)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: liked ? '#FDF1C4' : '#F3F1EA', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 }}
        >
          <LineIcon name="heart" size={15} color={liked ? C.orange : C.muted} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.dark, marginLeft: 6 }}>{p.votes + (liked ? 1 : 0)}</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: liked ? C.orange : C.muted, marginLeft: 6 }}>{liked ? 'Unlike' : 'Like'}</Text>
        </TouchableOpacity>
        <Pill onPress={() => setOpen((o) => !o)} active={open}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LineIcon name="comment" size={15} color="#3D5FC4" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted, marginLeft: 6 }}>{p.replies + comments.length} {p.replies + comments.length === 1 ? 'reply' : 'replies'}</Text>
          </View>
        </Pill>
      </View>
      {open && (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }}>
          {comments.map((c, i) => (
            <View key={c.id} style={{ flexDirection: 'row', marginBottom: 10 }}>
              <Av name={c.author} size={28} i={i + 1} />
              <View style={{ flex: 1, backgroundColor: '#F3F1EA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: C.dark }}>{c.author} <Text style={{ fontWeight: '500', color: C.muted }}>· {c.ago}</Text></Text>
                <Text style={{ fontSize: 13, color: C.dark, lineHeight: 19, marginTop: 2 }}>{c.text}</Text>
              </View>
            </View>
          ))}
          {comments.length === 0 && <Text style={[s.muted, { fontSize: 12, marginBottom: 10 }]}>No replies yet. Be the first to reply.</Text>}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" placeholder="Write a reply…" placeholderTextColor="#A5A296"
              style={{ flex: 1, backgroundColor: '#F3F1EA', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, color: C.dark, marginRight: 8 }} />
            <Pill onPress={send} active>Send</Pill>
          </View>
        </View>
      )}
      {popup.node}
    </View>
  );
}

export function BoardDetail({ board, user, onBack, embedded }: { board: Board; user?: User; onBack: () => void; embedded?: boolean }) {
  const d = BOARD_DETAILS[board.id] ?? fallbackDetail(board.name);
  const [tab, setTab] = useState<Tab>('posts');
  const [sort, setSort] = useState<Sort>('latest');
  const mem = useMembership(user?.email);
  const joined = mem.boards.includes(board.id);
  const members = board.members + (joined ? 1 : 0);
  const me = initials(user?.name ?? 'Juan Dela Cruz');
  const feed = sort === 'following' ? [] : sort === 'popular' ? [...d.feed].sort((a, b) => b.votes - a.votes) : d.feed;
  const toast = useToast();
  const popup = usePopup();
  const [composing, setComposing] = useState(false);
  const mine = useBoardPosts(board.id);
  const soon = () => setComposing(true);
  const onJoinPress = () => {
    if (!joined) {
      toggleBoard(user?.email, board.id);
      return toast.show(`Welcome to ${board.name}! You can post and comment now.`);
    }
    popup.show({
      icon: board.emoji, iconBg: '#FDF1C4',
      title: `Leave ${board.name}?`,
      body: 'You will stop seeing this board in your profile. You can rejoin anytime.',
      actions: [
        { text: 'Stay', style: 'secondary' },
        { text: 'Leave board', style: 'danger', onPress: () => { toggleBoard(user?.email, board.id); toast.show(`You left ${board.name}.`); } },
      ],
    });
  };
  if (composing) {
    return <CreatePost board={board} user={user} onClose={(to) => { setComposing(false); if (to) toast.show(`Posted to ${to.name}.`); }} />;
  }

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
      <TouchableOpacity onPress={onBack} accessibilityLabel="Back" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, color: C.dark, marginTop: -3 }}>‹</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark }}>{board.label ?? board.name}</Text>
        <Text style={s.libSub}>{fmtCount(members)} members · {board.online ?? 0} online</Text>
      </View>
      <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }} onPress={soon} accessibilityLabel="New post">
        <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark, marginTop: -2 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
  const body = (
    <>
        {/* Banner */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.dark, borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ fontSize: 22 }}>{board.emoji}</Text>
          </View>
          <View style={{ flex: 1, marginRight: 10 }}>
            {d.showTitle && <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 3 }}>{board.label ?? board.name}</Text>}
            <Text style={{ color: '#E8E4D8', fontSize: 11, lineHeight: 16 }}>{d.description}</Text>
          </View>
          <TouchableOpacity onPress={onJoinPress} accessibilityLabel={joined ? 'Leave board' : 'Join board'} style={{ backgroundColor: C.yellow, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: C.dark }}>{joined ? (d.joinLabel ? 'JOINED' : 'Joined') : (d.joinLabel ?? 'Join Community')}</Text>
          </TouchableOpacity>
        </View>
  
        {toast.node}
        {popup.node}

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
              <PhotoIcon />
            </TouchableOpacity>
            {sort !== 'following' && mine.map((p, i) => <BoardPostCard key={p.id} p={p} idx={i} me={user?.name ?? 'You'} onToast={toast.show} />)}
            {feed.map((p, i) => <BoardPostCard key={p.id} p={p} idx={i + mine.length} me={user?.name ?? 'You'} onToast={toast.show} />)}
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
    </>
  );
  // Embedded inside another scrolling page (e.g. LibPage) keep one scroll view; otherwise pin the header.
  if (embedded) {
    return (
      <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {header}
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
