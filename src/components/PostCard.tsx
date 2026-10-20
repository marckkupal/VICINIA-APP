import { useState } from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { useToast } from './Toast';
import { useActionSheet } from './ActionSheet';
import { s } from '../styles';
import { LineIcon } from './LineIcon';
import type { LineIconName } from './LineIcon';
import { C } from '../theme';
import type { Post } from '../types';
import { fmtCount } from '../utils';

export function PostCard({ p }: { p: Post }) {
  const [liked, setLiked] = useState(false);
  const [hidden, setHidden] = useState(false);
  const toast = useToast();
  const sheet = useActionSheet();
  const share = () => Share.share({ message: `${p.title} · ${p.handle} on Vicinia` }).catch(() => toast.show('Could not open the share sheet.'));
  const more = () => sheet.open(p.title, [
    { text: 'Share', onPress: share },
    { text: 'Hide this post', onPress: () => setHidden(true) },
    { text: 'Report', destructive: true, onPress: () => toast.show('Thanks, we’ll review this post (demo).') },
  ]);
  if (hidden) {
    return (
      <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={s.muted}>Post hidden.</Text>
        <TouchableOpacity onPress={() => setHidden(false)}><Text style={s.seeAll}>Undo</Text></TouchableOpacity>
      </View>
    );
  }
  const actions = [
    { key: 'like', label: liked ? 'Liked' : 'Like', icon: 'heart' as LineIconName, onPress: () => setLiked(!liked), active: liked },
    { key: 'comment', label: 'Comment', icon: 'comment' as LineIconName, onPress: () => toast.show('Comments are a demo preview. Nothing is posted.'), active: false },
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

      <View style={[s.postTile, { backgroundColor: p.tint }]}>
        <View style={s.rowBetween}>
          <View style={s.tilePill}><Text style={s.tilePillText}>{p.tag}</Text></View>
          {p.live && <View style={s.livePill}><Text style={s.livePillText}>Live</Text></View>}
        </View>
        <View>
          <Text style={s.tileTitle}>{p.title}</Text>
          <View style={[s.rowCenter, { marginTop: 6 }]}>
            <LineIcon name="heart" size={18} />
            <Text style={[s.tileStat, { marginLeft: 6 }]}>{fmtCount(p.likes + (liked ? 1 : 0))}</Text>
            <View style={{ marginLeft: 14 }}><LineIcon name="comment" size={18} /></View>
            <Text style={[s.tileStat, { marginLeft: 6 }]}>{p.comments}</Text>
          </View>
        </View>
      </View>

      <View style={s.actionRow}>
        {actions.map((a, i) => (
          <TouchableOpacity
            key={a.key}
            onPress={a.onPress}
            style={[s.actionPill, a.active && { backgroundColor: C.yellow }, i < actions.length - 1 && { marginRight: 8 }]}
          >
            <View style={{ marginRight: 8 }}><LineIcon name={a.icon} size={20} /></View>
            <Text style={s.actionText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {toast.node}
      {sheet.node}
    </View>
  );
}
