import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';

export type SheetAction = { text: string; onPress: () => void; destructive?: boolean };

// Bottom-sheet action menu. Replaces Alert.alert for 3+ options (Android alerts stack and clip them).
// Usage: const sheet = useActionSheet(); sheet.open('Title', [{ text, onPress }]); render {sheet.node}.
export function useActionSheet() {
  const [state, setState] = useState<{ title: string; actions: SheetAction[] } | null>(null);
  const close = useCallback(() => setState(null), []);
  const open = useCallback((title: string, actions: SheetAction[]) => setState({ title, actions }), []);

  const node = (
    <Modal transparent animationType="fade" visible={!!state} onRequestClose={close} statusBarTranslucent>
      <Pressable style={[s.scrim, { justifyContent: 'flex-end', padding: 16 }]} onPress={close} accessibilityLabel="Close menu">
        <Pressable style={{ backgroundColor: '#fff', borderRadius: 24, padding: 16 }} onPress={() => {}}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 12 }} />
          {!!state?.title && <Text style={[s.modalTitle, { textAlign: 'left', fontSize: 18, marginBottom: 8, paddingHorizontal: 4 }]} numberOfLines={2}>{state.title}</Text>}
          {state?.actions.map((a, i) => (
            <TouchableOpacity
              key={a.text}
              activeOpacity={0.7}
              accessibilityRole="button"
              onPress={() => { close(); setTimeout(a.onPress, 120); }}
              style={{ paddingVertical: 15, paddingHorizontal: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: a.destructive ? C.error : C.dark }}>{a.text}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            onPress={close}
            style={{ marginTop: 10, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream }}
          >
            <Text style={s.modalBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
  return { open, node };
}
