import { useRef } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { C } from '../theme';

// Comments / replies under a post.
// - Independent scrolling: the list scrolls inside its own box (about 40% of the screen), so the page behind it stays put.
//   The header and the "write a comment" row are outside the list and never scroll away.
// - Scroll isolation: a swipe that starts inside the list scrolls the list. The page only moves when the swipe starts outside it.
//   nestedScrollEnabled lets this work inside the page's own ScrollView on Android.
// - When `count` goes up (you just posted), the list scrolls down to show your new comment.
export function CommentsPanel({ title, count, note, empty, onClose, children, footer }: {
  title: string; count: number; note?: string; empty?: string; onClose: () => void; children: ReactNode; footer: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const maxHeight = Math.max(180, Math.min(340, Math.round(height * 0.4)));
  const list = useRef<ScrollView>(null);
  const seen = useRef(count);
  const onSize = () => {
    if (count > seen.current) list.current?.scrollToEnd({ animated: true });
    seen.current = count;
  };
  return (
    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: C.dark }}>{title} · {count}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`Hide ${title.toLowerCase()}`}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.muted }}>Hide</Text>
        </TouchableOpacity>
      </View>
      {!!note && <Text style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{note}</Text>}
      {count === 0 ? (
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{empty}</Text>
      ) : (
        <ScrollView
          ref={list}
          nestedScrollEnabled
          style={{ maxHeight, marginBottom: 10 }}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          onContentSizeChange={onSize}
        >
          {children}
        </ScrollView>
      )}
      {footer}
    </View>
  );
}
