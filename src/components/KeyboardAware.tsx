import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { ScrollViewProps, StyleProp, ViewStyle } from 'react-native';

// Keyboard avoidance for the whole app.
//
// KeyboardScreen: use on a screen that has a pinned footer or a bottom input (Save button, chat box). The page is
//   shortened by the keyboard's height, so the footer rides up above the keyboard and goes back when it closes.
// KeyboardScroll: a ScrollView that keeps the focused field visible. On iOS it adds the keyboard's height as bottom
//   inset and scrolls the focused input into view (automaticallyAdjustKeyboardInsets). Dragging the list down dismisses
//   the keyboard. Taps on buttons still work while the keyboard is open.
//
// Android: needs android:windowSoftInputMode="adjustResize" on the activity in AndroidManifest.xml (React Native's
// default template already has it). Then the window shrinks by itself and nothing else is needed here.
export const KeyboardScroll = forwardRef<ScrollView, ScrollViewProps>(function KeyboardScroll(props, ref) {
  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      {...props}
    />
  );
});

export function KeyboardScreen({ children, style, offset = 0 }: { children: ReactNode; style?: StyleProp<ViewStyle>; offset?: number }) {
  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, style]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={offset}>
      {children}
    </KeyboardAvoidingView>
  );
}
