import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from '../theme';

export type LineIconName = 'bell' | 'search' | 'sliders' | 'heart' | 'comment' | 'compass' | 'book' | 'cross' | 'cap' | 'care' | 'arrowUp' | 'arrowDown';

// Small outline icons built from plain Views (no icon/SVG dependency).
const HEART_PATH = 'M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.4 4.5 6.8 4.5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.1 3.4 4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z';
const ARROW_UP_PATH = 'M12 3.5 3.8 12.5H9v8h6v-8h5.2Z';
const COMMENT_PATH = 'M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-8.2L7 21.5v-4H4A1.5 1.5 0 0 1 2.5 16V7A1.5 1.5 0 0 1 4 5.5Z';

// `filled` paints the inside of heart / comment (used for the liked / opened state).
export function LineIcon({ name, size = 22, color = C.dark, filled = false }: { name: LineIconName; size?: number; color?: string; filled?: boolean }) {
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
    case 'care':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={HEART_PATH} stroke={color} strokeWidth={2} strokeLinejoin="round" fill={filled ? color : 'none'} />
        </Svg>
      );
    case 'comment':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={COMMENT_PATH} stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill={filled ? color : 'none'} />
        </Svg>
      );
    case 'arrowUp':
    case 'arrowDown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={name === 'arrowDown' ? { transform: [{ rotate: '180deg' }] } : undefined}>
          <Path d={ARROW_UP_PATH} stroke={color} strokeWidth={2} strokeLinejoin="round" fill={filled ? color : 'none'} />
        </Svg>
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
