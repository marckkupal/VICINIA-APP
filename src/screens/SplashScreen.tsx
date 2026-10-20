import React, { useEffect } from 'react';
import { View, StatusBar, Animated } from 'react-native';
import { s } from '../styles';

export function SplashScreen() {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <View style={s.splash}>
      <StatusBar barStyle="dark-content" />
      <Animated.Image
        source={require('../../assets/vicinia-logo.png')}
        style={[s.splashLogo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </View>
  );
}
