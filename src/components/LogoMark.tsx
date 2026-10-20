import { Image } from 'react-native';

// Small logo tile used on Welcome and Onboarding (assets/app-logo.png, square).
export function LogoMark({ size = 40 }: { size?: number; dark?: boolean }) {
  return (
    <Image
      source={require('../assets/app-logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Vicinia"
    />
  );
}
