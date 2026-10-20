import type { ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { BackButton } from './BackButton';
import { s } from '../styles';

// Shared layout for the library sub-screens: back button + title, scrolling body, pinned footer.
export function LibPage({ title, sub, onBack, children, footer }: { title: string; sub?: string; onBack: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <View style={s.lbPage}>
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.lbHeaderTitle}>{title}</Text>
          {!!sub && <Text style={s.libSub}>{sub}</Text>}
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
        {children}
        <View style={{ height: 12 }} />
      </ScrollView>
      {!!footer && <View style={s.lbFooter}>{footer}</View>}
    </View>
  );
}
