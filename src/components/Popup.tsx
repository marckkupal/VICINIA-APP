import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';
import { OfficeIcon } from './OfficeIcon';
import type { OfficeIconName } from './OfficeIcon';

// 'primary' = yellow, 'secondary' = white outline, 'danger' = red, 'dark' = near-black with yellow text (emergencies).
export type PopupAction = {
  text: string;
  onPress?: () => void;
  style?: 'primary' | 'secondary' | 'danger' | 'dark';
};

export type PopupConfig = {
  icon?: string;
  // Line icon from OfficeIcon; used instead of the emoji `icon` when set.
  iconName?: OfficeIconName;
  iconBg?: string;
  title: string;
  body?: string;
  // Optional key/value rows shown in a small card (hours, phone, schedule, etc.).
  details?: { label: string; value: string }[];
  actions: PopupAction[];
  // Tapping the scrim or the hardware back button closes the popup. Defaults to true.
  dismissable?: boolean;
};

const btnStyle = (style: PopupAction['style'] = 'primary') => {
  switch (style) {
    case 'secondary': return { bg: '#fff', fg: C.dark, border: C.border };
    case 'danger': return { bg: C.error, fg: '#fff', border: C.error };
    case 'dark': return { bg: C.dark, fg: C.yellow, border: C.dark };
    default: return { bg: C.yellow, fg: C.dark, border: C.yellow };
  }
};

// Themed replacement for Alert.alert.
// Usage: const popup = usePopup(); popup.show({ title, body, actions: [...] }); render {popup.node} once in the screen.
export function usePopup() {
  const [cfg, setCfg] = useState<PopupConfig | null>(null);
  const close = useCallback(() => setCfg(null), []);
  const show = useCallback((c: PopupConfig) => setCfg(c), []);

  const dismissable = cfg?.dismissable !== false;
  const stacked = (cfg?.actions.length ?? 0) > 2;

  const node = (
    <Modal transparent animationType="fade" visible={!!cfg} onRequestClose={dismissable ? close : undefined} statusBarTranslucent>
      <Pressable style={s.scrim} onPress={dismissable ? close : undefined} accessibilityLabel="Close popup">
        <Pressable style={s.modalCard} onPress={() => {}} accessibilityViewIsModal>
          {dismissable && (
            <TouchableOpacity style={s.modalClose} onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 16, color: C.dark }}>✕</Text>
            </TouchableOpacity>
          )}
          {(!!cfg?.icon || !!cfg?.iconName) && (
            <View style={[s.modalIcon, !!cfg.iconBg && { backgroundColor: cfg.iconBg }]}>
              {cfg.iconName ? <OfficeIcon name={cfg.iconName} size={20} /> : <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>}
            </View>
          )}
          <Text style={[s.modalTitle, { paddingRight: dismissable ? 40 : 0 }]} accessibilityRole="header">{cfg?.title}</Text>
          {!!cfg?.body && <Text style={s.modalBody}>{cfg.body}</Text>}

          {!!cfg?.details?.length && (
            <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, marginTop: 14 }}>
              {cfg.details.map((d, i) => (
                <View key={d.label} style={{ marginTop: i ? 10 : 0 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: C.muted }}>{d.label.toUpperCase()}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark, marginTop: 2 }}>{d.value}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[s.modalActions, stacked && { flexDirection: 'column' }]}>
            {cfg?.actions.map((a, i) => {
              const b = btnStyle(a.style);
              return (
                <TouchableOpacity
                  key={a.text}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  // Close first, then run the action, so a follow-up modal doesn't collide with this one dismissing (iOS).
                  onPress={() => { close(); if (a.onPress) setTimeout(a.onPress, 150); }}
                  style={[
                    s.modalBtn,
                    { backgroundColor: b.bg, borderWidth: 1, borderColor: b.border },
                    stacked ? { flex: 0, marginTop: i ? 10 : 0 } : i < (cfg?.actions.length ?? 0) - 1 && { marginRight: 12 },
                  ]}
                >
                  <Text style={[s.modalBtnText, { color: b.fg }]}>{a.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return { show, close, node };
}
