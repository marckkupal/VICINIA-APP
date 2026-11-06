import { Image, Modal, Platform, Pressable, ScrollView, StatusBar, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

// Full-screen picture viewer (lightbox). Black background, photo fitted to the screen, close button, tap outside the photo to close.
// iOS: pinch to zoom up to 4x and drag to look around (the scroll view handles it). Android: shows the photo fitted to the screen.
export function PhotoViewer({ uri, visible, onClose, caption }: { uri: string; visible: boolean; onClose: () => void; caption?: string }) {
  const { width, height } = useWindowDimensions();
  const top = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12;
  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent presentationStyle="fullScreen" supportedOrientations={['portrait', 'landscape']}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ width, height, alignItems: 'center', justifyContent: 'center' }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          bouncesZoom
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onClose} accessibilityLabel="Close photo" style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={{ uri }} resizeMode="contain" style={{ width, height: height * 0.8 }} accessibilityIgnoresInvertColors />
          </Pressable>
        </ScrollView>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close photo" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ position: 'absolute', top, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -1 }}>✕</Text>
        </TouchableOpacity>
        {!!caption && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 40, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{caption}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
