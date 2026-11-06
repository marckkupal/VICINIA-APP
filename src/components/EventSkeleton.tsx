import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { C } from '../theme';

// Grey placeholder shapes shown while events load. They pulse gently, unless the phone asks to reduce motion.
function usePulse() {
  const v = useRef(new Animated.Value(0.55)).current;
  const [still, setStill] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled?.().then(setStill).catch(() => {}); }, []);
  useEffect(() => {
    if (still) { v.setValue(0.7); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.55, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [still, v]);
  return v;
}

const block = (extra: object) => ({ backgroundColor: C.border, borderRadius: 8, ...extra });

export function EventSkeleton({ featured = true, rows = 3 }: { featured?: boolean; rows?: number }) {
  const opacity = usePulse();
  return (
    <Animated.View style={{ opacity }} accessible accessibilityRole="progressbar" accessibilityLabel="Loading events" accessibilityState={{ busy: true }}>
      {featured && <View style={{ height: 160, borderRadius: 22, backgroundColor: C.border, marginBottom: 20 }} />}
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 88, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 14, marginBottom: 12 }}>
          <View style={{ width: 66, height: 66, borderRadius: 16, backgroundColor: C.border }} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={block({ height: 16, width: '70%' })} />
            <View style={block({ height: 12, width: '50%', marginTop: 8 })} />
            <View style={block({ height: 12, width: '35%', marginTop: 8 })} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
