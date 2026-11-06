import { useEffect, useState } from 'react';
import { Image, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { C } from '../theme';

// An image that can never look broken or borrowed.
// - If there is no source, or it fails to load, a neutral grey placeholder fills the same box. It never shows another
//   organization's logo or any default picture from the data.
// - Posters keep their own proportions (resizeMode "contain" inside a box of the image's real aspect ratio), so nothing is stretched or cropped.
//   Pass lockRatio for logos, which sit in a fixed box (default 1:1) and are scaled to fit inside it.
export function SafeImage({ source, ratio = 4 / 5, lockRatio, icon = '🖼️', label, style, radius = 12 }: {
  source?: ImageSourcePropType; ratio?: number; lockRatio?: boolean; icon?: string; label?: string; style?: StyleProp<ViewStyle>; radius?: number;
}) {
  const key = !source ? '' : typeof source === 'number' ? `n${source}` : Array.isArray(source) ? 'multi' : (source as any).uri ?? '';
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState<number | undefined>();
  useEffect(() => { setFailed(false); setLoaded(undefined); }, [key]);

  const bundled = typeof source === 'number' ? Image.resolveAssetSource(source) : undefined;
  const natural = bundled?.width && bundled?.height ? bundled.width / bundled.height : loaded;
  const r = lockRatio ? ratio : natural ?? ratio;
  const box = { width: '100%' as const, aspectRatio: r, borderRadius: radius, overflow: 'hidden' as const };

  if (!source || failed) {
    return (
      <View
        accessible accessibilityLabel={label ? `${label}, image not available` : 'Image not available'}
        style={[box, { backgroundColor: '#ECEAE2', alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ fontSize: 26, color: C.muted, opacity: 0.6 }}>{icon}</Text>
      </View>
    );
  }
  return (
    <View style={[box, { backgroundColor: '#F4F2EA' }, style]}>
      <Image
        source={source} accessibilityLabel={label} resizeMode="contain"
        style={{ width: '100%', height: '100%' }}
        onError={() => setFailed(true)}
        onLoad={(ev) => {
          const src = (ev as any)?.nativeEvent?.source;
          if (src?.width && src?.height) setLoaded(src.width / src.height);
        }}
      />
    </View>
  );
}
