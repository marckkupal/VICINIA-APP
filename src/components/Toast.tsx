import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { s } from '../styles';

// Lightweight inline feedback banner. `show(msg)` displays it for ~2.5s; render `node` where it should appear.
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2500);
  }, []);
  const node = msg ? (
    <View style={s.successBanner} accessibilityLiveRegion="polite">
      <Text style={s.successBannerText}>{msg}</Text>
    </View>
  ) : null;
  return { show, node };
}
