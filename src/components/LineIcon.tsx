import { Text, View } from 'react-native';
import { C } from '../theme';

export type LineIconName = 'bell' | 'search' | 'sliders' | 'heart' | 'comment' | 'compass' | 'book' | 'cross' | 'cap' | 'care';

// Small outline icons built from plain Views (no icon/SVG dependency).
export function LineIcon({ name, size = 22, color = C.dark }: { name: LineIconName; size?: number; color?: string }) {
  const w = Math.max(1.6, size / 13);
  const box = { width: size, height: size, alignItems: 'center', justifyContent: 'center' } as const;
  const abs = { position: 'absolute' } as const;

  switch (name) {
    case 'bell':
      return (
        <View style={box}>
          <View style={{ width: size * 0.62, height: size * 0.62, borderWidth: w, borderColor: color, borderTopLeftRadius: size * 0.31, borderTopRightRadius: size * 0.31, borderBottomWidth: 0, marginTop: -size * 0.08 }} />
          <View style={{ width: size * 0.84, height: w, backgroundColor: color, borderRadius: w, marginTop: -w / 2 }} />
          <View style={{ width: size * 0.2, height: size * 0.1, borderBottomLeftRadius: size, borderBottomRightRadius: size, backgroundColor: color, marginTop: 2 }} />
        </View>
      );
    case 'search':
      return (
        <View style={box}>
          <View style={{ ...abs, left: size * 0.08, top: size * 0.08, width: size * 0.62, height: size * 0.62, borderRadius: size, borderWidth: w, borderColor: color }} />
          <View style={{ ...abs, right: size * 0.06, bottom: size * 0.16, width: size * 0.32, height: w, borderRadius: w, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 'sliders':
      return (
        <View style={box}>
          {[0.22, 0.5, 0.78].map((y, i) => (
            <View key={y}>
              <View style={{ ...abs, left: -size * 0.4, top: size * (y - 0.5), width: size * 0.8, height: w, backgroundColor: color, borderRadius: w }} />
              <View style={{ ...abs, left: size * (i === 1 ? 0.06 : i === 0 ? -0.2 : 0.14) - size * 0.08, top: size * (y - 0.5) - size * 0.1, width: size * 0.2, height: size * 0.2, borderRadius: size, backgroundColor: C.cream, borderWidth: w, borderColor: color }} />
            </View>
          ))}
        </View>
      );
    case 'heart':
      return (
        <View style={box}>
          <Text style={{ fontSize: size * 1.05, color, lineHeight: size * 1.15, includeFontPadding: false }}>♡</Text>
        </View>
      );
    case 'care':
      return (
        <View style={box}>
          <Text style={{ fontSize: size * 1.05, color, lineHeight: size * 1.15, includeFontPadding: false }}>♡</Text>
        </View>
      );
    case 'comment':
      return (
        <View style={box}>
          <View style={{ width: size * 0.82, height: size * 0.62, borderWidth: w, borderColor: color, borderRadius: size * 0.2, marginTop: -size * 0.06 }} />
          <View style={{ ...abs, left: size * 0.2, bottom: size * 0.12, width: size * 0.2, height: size * 0.2, borderLeftWidth: w, borderBottomWidth: w, borderColor: color, backgroundColor: 'transparent', transform: [{ rotate: '-30deg' }, { skewY: '20deg' }] }} />
        </View>
      );
    case 'compass':
      return (
        <View style={box}>
          <View style={{ width: size * 0.86, height: size * 0.86, borderRadius: size, borderWidth: w, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: size * 0.3, height: size * 0.3, borderWidth: w, borderColor: color, borderRadius: 2, transform: [{ rotate: '45deg' }] }} />
          </View>
        </View>
      );
    case 'book':
      return (
        <View style={[box, { flexDirection: 'row' }]}>
          <View style={{ width: size * 0.42, height: size * 0.64, borderWidth: w, borderColor: color, borderTopLeftRadius: 3, borderBottomLeftRadius: 3, borderRightWidth: w / 2 }} />
          <View style={{ width: size * 0.42, height: size * 0.64, borderWidth: w, borderColor: color, borderTopRightRadius: 3, borderBottomRightRadius: 3, borderLeftWidth: w / 2 }} />
        </View>
      );
    case 'cross': {
      const t = size * 0.38;
      return (
        <View style={box}>
          <View style={{ ...abs, width: t, height: size * 0.9, borderWidth: w + 0.6, borderColor: color, borderRadius: 3 }} />
          <View style={{ ...abs, width: size * 0.9, height: t, borderWidth: w + 0.6, borderColor: color, borderRadius: 3 }} />
          <View style={{ ...abs, width: t - 2, height: t + 2, backgroundColor: 'transparent' }} />
        </View>
      );
    }
    case 'cap':
      return (
        <View style={box}>
          <View style={{ transform: [{ scaleY: 0.55 }], marginTop: -size * 0.12 }}>
            <View style={{ width: size * 0.56, height: size * 0.56, borderWidth: w, borderColor: color, borderRadius: 2, transform: [{ rotate: '45deg' }] }} />
          </View>
          <View style={{ ...abs, bottom: size * 0.2, width: size * 0.4, height: size * 0.18, borderWidth: w, borderTopWidth: 0, borderColor: color, borderBottomLeftRadius: size, borderBottomRightRadius: size }} />
        </View>
      );
  }
}
