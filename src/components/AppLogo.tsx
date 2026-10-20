import { Image } from 'react-native';

// Home-header logo: dark rounded tile with a yellow location pin (assets/app-logo.png, square).
export function AppLogo({ size = 56 }: { size?: number }) {
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
