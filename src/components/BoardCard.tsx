import { Text, TouchableOpacity, View } from 'react-native';
import { blurbOf, categoryOf, styleOf } from '../boardCategories';
import { C } from '../theme';
import type { Board } from '../types';
import { fmtCount } from '../utils';

// Identity badge: the category's icon on the category's color, in a round frame ringed with the accent.
// Every board gets one the same way, so there is no photo to load and nothing random.
export function BoardBadge({ board, size = 48 }: { board: Pick<Board, 'category' | 'label'>; size?: number }) {
  const look = styleOf(board);
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: look.tint, borderWidth: 2, borderColor: look.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.46 }}>{look.emoji}</Text>
    </View>
  );
}

// Small category label with a colored dot, like a subreddit flair.
export function BoardTag({ board }: { board: Pick<Board, 'category' | 'label'> }) {
  const look = styleOf(board);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: look.tint, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: look.accent, marginRight: 5 }} />
      <Text style={{ fontSize: 11, fontWeight: '800', color: C.dark }}>{categoryOf(board)}</Text>
    </View>
  );
}

// One community in the list: badge + name + category on top, short description, then members / online / new posts.
// `members` is the count to show (already including you if you joined). `preview` makes it a non-tappable sample.
export function BoardCard({ board, members, joined, onPress, preview }: { board: Board; members: number; joined?: boolean; onPress?: () => void; preview?: boolean }) {
  const blurb = blurbOf(board);
  const label = `${board.label ?? board.name}, ${categoryOf(board)} board, ${members} ${members === 1 ? 'member' : 'members'}${joined ? ', joined' : ''}`;
  return (
    <TouchableOpacity
      activeOpacity={preview ? 1 : 0.85}
      onPress={preview ? undefined : onPress}
      disabled={preview}
      accessibilityRole={preview ? undefined : 'button'}
      accessibilityLabel={label}
      style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <BoardBadge board={board} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: C.dark, marginBottom: 5 }} numberOfLines={1}>{board.label ?? board.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <BoardTag board={board} />
            {!!board.sample && (
              <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: C.muted, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: C.muted }}>{board.sampleLabel ?? '[Sample]'}</Text>
              </View>
            )}
          </View>
        </View>
        {joined
          ? (
            <View style={{ backgroundColor: '#FDF1C4', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: C.dark }}>✓ Joined</Text>
            </View>
          )
          : !preview && <Text style={{ fontSize: 22, color: C.muted, marginTop: -2 }}>›</Text>}
      </View>
      {!!blurb && <Text style={{ fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 10 }} numberOfLines={2}>{blurb}</Text>}
      {board.sample ? (
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>Details not confirmed yet</Text>
      ) : (
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.dark }}>{fmtCount(members)} {members === 1 ? 'member' : 'members'}</Text>
        {(board.online ?? 0) > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.green, marginRight: 5 }} />
            <Text style={{ fontSize: 12, color: C.muted }}>{board.online} online</Text>
          </View>
        )}
        {(board.newPosts ?? 0) > 0 && <Text style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}>{board.newPosts} new posts</Text>}
      </View>
      )}
    </TouchableOpacity>
  );
}
