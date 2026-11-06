import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { BackButton } from './BackButton';
import { KeyboardScreen, KeyboardScroll } from './KeyboardAware';
import { s } from '../styles';

// Shared layout for the library sub-screens: back button + title, scrolling body, pinned footer.
// Keyboard-aware: when a field is focused the footer button rides up above the keyboard and the field stays in view.
export function LibPage({ title, sub, onBack, children, footer }: { title: string; sub?: string; onBack: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <KeyboardScreen style={s.lbPage}>
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.lbHeaderTitle}>{title}</Text>
          {!!sub && <Text style={s.libSub}>{sub}</Text>}
        </View>
      </View>
      <KeyboardScroll showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {children}
        <View style={{ height: 12 }} />
      </KeyboardScroll>
      {!!footer && <View style={s.lbFooter}>{footer}</View>}
    </KeyboardScreen>
  );
}
