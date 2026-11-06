import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { s } from '../styles';

type Kind = 'success' | 'error';

// Lightweight inline feedback banner. `show(msg)` (success) / `error(msg)` display it for ~2.5s (errors stay 4s);
// render `node` where it should appear.
export function useToast() {
  const [state, setState] = useState<{ msg: string; kind: Kind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const open = useCallback((msg: string, kind: Kind) => {
    setState({ msg, kind });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(null), kind === 'error' ? 4000 : 2500);
  }, []);
  const show = useCallback((m: string) => open(m, 'success'), [open]);
  const error = useCallback((m: string) => open(m, 'error'), [open]);
  const node = state ? (
    <View style={state.kind === 'error' ? s.errorBox : s.successBanner} accessibilityLiveRegion={state.kind === 'error' ? 'assertive' : 'polite'}>
      <Text style={state.kind === 'error' ? s.errorText : s.successBannerText}>{state.kind === 'error' ? '⚠️  ' : '✓  '}{state.msg}</Text>
    </View>
  ) : null;
  return { show, error, node };
}
