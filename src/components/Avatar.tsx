import { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { initials } from '../utils';
import { PhotoViewer } from './PhotoViewer';

// `viewable`: tapping the profile photo opens it full screen (PhotoViewer). Only applies when the user has a photo.
export function Avatar({ user, size = 36, viewable = false }: { user: User; size?: number; viewable?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!user.avatarUri) {
    return (
      <View style={[s.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontWeight: '800', color: C.dark, fontSize: size * 0.36 }}>{initials(user.name)}</Text>
      </View>
    );
  }
  const img = <Image source={{ uri: user.avatarUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  if (!viewable) return img;
  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(true)} accessibilityRole="imagebutton" accessibilityLabel="View profile photo">{img}</TouchableOpacity>
      <PhotoViewer uri={user.avatarUri} visible={open} onClose={() => setOpen(false)} caption={user.name} />
    </>
  );
}
