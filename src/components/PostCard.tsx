import { useState } from 'react';
import { Image, Linking, View, Text, TouchableOpacity, Share, TextInput } from 'react-native';
import { useToast } from './Toast';
import { useActionSheet } from './ActionSheet';
import { s } from '../styles';
import { LineIcon } from './LineIcon';
import type { LineIconName } from './LineIcon';
import { C } from '../theme';
import type { Post, User } from '../types';
import { fmtCount } from '../utils';
import { usePostActivity } from '../postActivity';
import { CommentsPanel } from './CommentsPanel';
import { POST_REPORT_REASONS, reportItem, useHasReported } from '../reports';

export function PostCard({ p, user }: { p: Post; user?: User | null }) {
  // Likes and comments are saved per account (not local state), so they are still there after leaving the page or closing the app.
  const { liked, toggleLike, replies: thread, addReply, hasSample } = usePostActivity(`post:${p.id}`, user?.email, { replies: p.comments, ago: '6h ago', author: p.name });
  const [hidden, setHidden] = useState(false);
  const reportKey = `post:${p.id}`;
  const reported = useHasReported(reportKey, user?.email);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return toast.show('Write a comment first.');
    addReply(user?.name ?? 'You', text);
    setText('');
  };
  const toast = useToast();
  const sheet = useActionSheet();
  const share = () => Share.share({ message: `${p.title} · ${p.handle} on Vicinia` }).catch(() => toast.show('Could not open the share sheet.'));
  // Step 2 of Report: pick what is wrong with the post.
  const chooseReason = () => sheet.open('Why are you reporting this post?', [
    ...POST_REPORT_REASONS.map((r) => ({
      text: r,
      onPress: () => { reportItem(reportKey, r, user?.email); toast.show(`Thanks, your report (${r.toLowerCase()}) was sent (demo).`); },
    })),
  ]);
  const more = () => sheet.open(p.title, [
    { text: 'Share', onPress: share },
    { text: 'Hide this post', onPress: () => setHidden(true) },
    { text: reported ? 'Reported' : 'Report', destructive: !reported, onPress: reported ? () => toast.show('You already reported this post.') : chooseReason },
  ]);
  if (hidden) {
    return (
      <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={s.muted}>Post hidden.</Text>
        <TouchableOpacity onPress={() => setHidden(false)}><Text style={s.seeAll}>Undo</Text></TouchableOpacity>
      </View>
    );
  }
  const hasMedia = !!p.media && p.media.length > 0;
  const actions = [
    { key: 'like', label: liked ? 'Unlike' : 'Like', icon: 'heart' as LineIconName, onPress: toggleLike, active: liked },
    { key: 'comment', label: 'Comment', icon: 'comment' as LineIconName, onPress: () => setOpen((o) => !o), active: open },
    { key: 'share', label: 'Share', icon: 'compass' as LineIconName, onPress: share, active: false },
  ];
  return (
    <View style={s.card}>
      <View style={s.rowCenter}>
        <View style={[s.avatarCircle, { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: p.avatarBg }]}>
          <Text style={{ fontWeight: '800', fontSize: 12, color: C.dark }}>{p.ini}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.postName}>{p.name}</Text>
          <Text style={s.muted}>{p.handle}</Text>
        </View>
        <TouchableOpacity style={s.moreBtn} onPress={more} accessibilityLabel="More options">
          <View style={{ width: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[0, 1, 2, 3].map((i) => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#8A8678', marginBottom: i < 2 ? 4 : 0 }} />)}
          </View>
        </TouchableOpacity>
      </View>

      <View style={[s.postTile, { backgroundColor: p.tint }, hasMedia && { height: 'auto', minHeight: 250 }]}>
        <View style={s.rowBetween}>
          <View style={s.tilePill}><Text style={s.tilePillText}>{p.tag}</Text></View>
          {p.live && <View style={s.livePill}><Text style={s.livePillText}>Live</Text></View>}
        </View>
        {hasMedia && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginBottom: 6 }}>
            {p.media!.map((uri, i) => (
              <Image
                key={i} source={{ uri }} resizeMode="cover"
                style={{ width: p.media!.length === 1 ? '100%' : '49%', height: p.media!.length === 1 ? 200 : 120, borderRadius: 12, backgroundColor: '#F3F1EA', marginRight: p.media!.length > 1 && i % 2 === 0 ? '2%' : 0, marginBottom: 6 }}
              />
            ))}
          </View>
        )}
        <View>
          <Text style={s.tileTitle}>{p.title}</Text>
          {!!p.body && <Text style={{ fontSize: 13, color: C.dark, lineHeight: 19, marginTop: 6 }}>{p.body}</Text>}
          {!!p.link && (
            <Text numberOfLines={1} onPress={() => Linking.openURL(p.link as string).catch(() => toast.show('Could not open this link.'))} accessibilityRole="link" style={{ fontSize: 13, fontWeight: '700', color: '#3D5FC4', marginTop: 6, textDecorationLine: 'underline' }}>{p.link}</Text>
          )}
          {!!p.location && <Text style={{ fontSize: 12, fontWeight: '700', color: C.dark, marginTop: 8 }}>📍 {p.location.name}</Text>}
          <View style={[s.rowCenter, { marginTop: 8 }]}>
            <TouchableOpacity onPress={toggleLike} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={liked ? 'Unlike post' : 'Like post'} style={s.rowCenter}>
              <LineIcon name="heart" size={20} color={liked ? C.orange : C.dark} filled={liked} />
              <Text style={[s.tileStat, { marginLeft: 6 }]}>{fmtCount(p.likes + (liked ? 1 : 0))}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOpen((o) => !o)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`${thread.length} comments, tap to ${open ? 'hide' : 'view'}`} style={[s.rowCenter, { marginLeft: 16 }]}>
              <LineIcon name="comment" size={20} color={open ? '#3D5FC4' : C.dark} filled={open} />
              <Text style={[s.tileStat, { marginLeft: 6 }]}>{thread.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={s.actionRow}>
        {actions.map((a, i) => (
          <TouchableOpacity
            key={a.key}
            onPress={a.onPress}
            style={[s.actionPill, { justifyContent: 'center', paddingHorizontal: 6, minWidth: 0 }, a.active && { backgroundColor: C.yellow }, i < actions.length - 1 && { marginRight: 8 }]}
          >
            <View style={{ marginRight: 6 }}><LineIcon name={a.icon} size={20} color={a.active && a.key === 'like' ? C.orange : C.dark} filled={a.active && (a.key === 'like' || a.key === 'comment')} /></View>
            <Text style={[s.actionText, { flexShrink: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {open && (
        <CommentsPanel
          title="Comments" count={thread.length} onClose={() => setOpen(false)}
          note={hasSample ? 'Sample comments for the demo. Comments you write are saved on this device.' : undefined}
          empty="No comments yet. Be the first to comment."
          footer={(
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" placeholder="Write a comment…" placeholderTextColor="#A5A296"
                style={{ flex: 1, backgroundColor: '#F3F1EA', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, color: C.dark, marginRight: 8 }} />
              <TouchableOpacity onPress={send} style={[s.actionPill, { backgroundColor: C.yellow, flex: 0 }]}><Text style={s.actionText}>Send</Text></TouchableOpacity>
            </View>
          )}
        >
          {thread.map((c) => (
            <View key={c.id} style={{ backgroundColor: '#F3F1EA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: C.dark }}>{c.author} <Text style={{ fontWeight: '500', color: C.muted }}>· {c.ago}</Text></Text>
              <Text style={{ fontSize: 13, color: C.dark, lineHeight: 19, marginTop: 2 }}>{c.text}</Text>
            </View>
          ))}
        </CommentsPanel>
      )}
      {toast.node}
      {sheet.node}
    </View>
  );
}
