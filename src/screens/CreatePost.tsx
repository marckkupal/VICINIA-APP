import { useState } from 'react';
import { Alert, Image, View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { ProfileIcon } from '../components/ProfileIcon';
import type { ProfileIconName } from '../components/ProfileIcon';
import { useActionSheet } from '../components/ActionSheet';
import { useToast } from '../components/Toast';
import { BOARDS } from '../data';
import { addBoardPost } from '../boardPosts';
import { s } from '../styles';
import { C } from '../theme';
import type { Board, User } from '../types';
import { fmtCount } from '../utils';

type Mode = 'post' | 'media' | 'link';
const MODES: { key: Mode; label: string; icon: ProfileIconName }[] = [
  { key: 'post', label: 'Post', icon: 'textLeft' }, { key: 'media', label: 'Media', icon: 'image' }, { key: 'link', label: 'Link', icon: 'link' },
];
const FLAIRS = ['Discussion', 'Question', 'Event', 'Showcase', 'Tip'];
const TITLE_MAX = 150;
const MEDIA_MAX = 4;
type Media = { uri: string; type: 'photo' | 'video' };
const box = { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16 } as const;

export function CreatePost({ board: initial, user, onClose }: { board: Board; user?: User; onClose: (postedTo?: Board) => void }) {
  const [board, setBoard] = useState<Board>(initial);
  const [mode, setMode] = useState<Mode>('post');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [flair, setFlair] = useState<string | null>(null);
  const [alerts, setAlerts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sheet = useActionSheet();
  const toast = useToast();

  const change = () => sheet.open('Post to which board?', BOARDS.map((b) => ({ text: `${b.emoji}  ${b.name}`, onPress: () => setBoard(b) })));
  const pickFlair = () => sheet.open('Add flair', [
    ...FLAIRS.map((f) => ({ text: f, onPress: () => setFlair(f) })),
    ...(flair ? [{ text: 'Remove flair', destructive: true, onPress: () => setFlair(null) }] : []),
  ]);
  // Formatting buttons add markers at the end of the text (bold = **text**, italic = _text_).
  const addToBody = (snippet: string) => { setMode('post'); setBody((b) => b + snippet); };
  const pickMedia = async () => {
    setMode('media'); setError(null);
    if (media.length >= MEDIA_MAX) return Alert.alert('Limit reached', `You can add up to ${MEDIA_MAX} photos or videos.`);
    const r = await launchImageLibrary({ mediaType: 'mixed', selectionLimit: MEDIA_MAX - media.length, quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
    if (r.didCancel) return;
    if (r.errorCode) return Alert.alert('Could not open photos', r.errorMessage ?? 'Please try again.');
    const picked: Media[] = (r.assets ?? []).filter((a) => !!a.uri).map((a) => ({ uri: a.uri as string, type: a.type?.startsWith('video') ? 'video' : 'photo' }));
    setMedia((m) => [...m, ...picked].slice(0, MEDIA_MAX));
  };
  const validLink = /^https?:\/\/\S+\.\S+/i.test(link.trim());

  const publish = () => {
    if (!title.trim()) return setError('Add a title for your post.');
    if (mode === 'link' && !validLink) return setError('Paste a valid link that starts with http:// or https://');
    if (mode === 'media' && media.length === 0) return setError('Add at least one photo or video, or switch to Post.');
    addBoardPost(board.id, {
      id: `me-${Date.now()}`, author: user?.name ?? 'You', ago: 'just now', votes: 0, replies: 0,
      title: title.trim(), text: body.trim(), flair: flair ?? undefined, link: mode === 'link' ? link.trim() : undefined, alerts, media: mode === 'media' && media.length ? media : undefined,
    });
    onClose(board);
  };

  const actionCard = (bg: string, icon: ProfileIconName, iconColor: string, label: string, sub: string, onPress: () => void) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ flex: 1, backgroundColor: bg, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}><ProfileIcon name={icon} size={20} color={iconColor} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark }}>{label}</Text>
        <Text style={{ fontSize: 12, color: C.muted }}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
  const chip = (icon: ProfileIconName, label: string, on: boolean, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: on ? '#FDF1C4' : '#fff', borderWidth: 1, borderColor: on ? '#F3E3A0' : C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 }}>
      <ProfileIcon name={icon} size={16} color={C.dark} />
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark, marginLeft: 8 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.screen}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <TouchableOpacity onPress={() => onClose()} accessibilityLabel="Close" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <ProfileIcon name="close" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: C.dark }}>Create post</Text>
          <Text style={s.libSub}>Share with your campus</Text>
        </View>
        <TouchableOpacity onPress={publish} style={{ backgroundColor: C.yellow, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 11 }}>
          <Text style={{ fontWeight: '900', fontSize: 13, color: C.dark, letterSpacing: 0.5 }}>POST</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.fill} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Posting to */}
        <View style={{ backgroundColor: C.dark, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Text style={{ fontSize: 26 }}>{board.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.yellow }}>POSTING TO</Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>{board.name}</Text>
            <Text style={{ fontSize: 12, color: '#B8B4A6' }}>{fmtCount(board.members)} members · Public board</Text>
          </View>
          <TouchableOpacity onPress={change} style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityLabel="Change board">
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.yellow, marginRight: 4 }}>Change</Text>
            <ProfileIcon name="chevron" size={16} color={C.yellow} />
          </TouchableOpacity>
        </View>

        {/* Post / Media / Link */}
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          {MODES.map((m, i) => {
            const on = mode === m.key;
            return (
              <TouchableOpacity key={m.key} onPress={() => { setMode(m.key); setError(null); }} activeOpacity={0.8}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, backgroundColor: on ? C.dark : '#fff', borderWidth: 1, borderColor: on ? C.dark : C.border, marginRight: i < 2 ? 8 : 0 }}>
                <ProfileIcon name={m.icon} size={16} color={on ? C.yellow : C.muted} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: on ? '#fff' : C.muted, marginLeft: 8 }}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Title */}
        <View style={[box, { padding: 14, marginBottom: 12 }]}>
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.muted }}>TITLE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput value={title} onChangeText={(t) => { setTitle(t); setError(null); }} maxLength={TITLE_MAX} placeholder="An interesting title" placeholderTextColor="#A5A296" style={{ flex: 1, fontSize: 15, fontWeight: '700', color: C.dark, paddingVertical: 6 }} />
            <Text style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{title.length}/{TITLE_MAX}</Text>
          </View>
        </View>

        {/* Body / Link / Media */}
        {mode === 'post' && (
          <View style={[box, { padding: 14, marginBottom: 12 }]}>
            <TextInput value={body} onChangeText={setBody} multiline placeholder="What do you want to share?" placeholderTextColor="#A5A296" style={{ minHeight: 120, fontSize: 15, lineHeight: 22, color: C.dark, textAlignVertical: 'top' }} />
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              {[
                { k: 'b', node: <Text style={{ fontWeight: '900', fontSize: 14, color: C.dark }}>B</Text>, on: () => addToBody(' **bold** ') },
                { k: 'i', node: <Text style={{ fontStyle: 'italic', fontWeight: '700', fontSize: 14, color: C.dark }}>I</Text>, on: () => addToBody(' _italic_ ') },
                { k: 'l', node: <ProfileIcon name="list" size={16} />, on: () => addToBody('\n• ') },
                { k: 'k', node: <ProfileIcon name="link" size={16} />, on: () => addToBody(' https://') },
              ].map((b) => (
                <TouchableOpacity key={b.k} onPress={b.on} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3F1EA', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>{b.node}</TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {mode === 'link' && (
          <View style={[box, { padding: 14, marginBottom: 12 }]}>
            <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.muted }}>LINK</Text>
            <TextInput value={link} onChangeText={(t) => { setLink(t); setError(null); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://" placeholderTextColor="#A5A296" style={{ fontSize: 15, color: C.dark, paddingVertical: 6 }} />
            <TextInput value={body} onChangeText={setBody} multiline placeholder="Add a note (optional)" placeholderTextColor="#A5A296" style={{ minHeight: 60, fontSize: 14, color: C.dark, textAlignVertical: 'top', marginTop: 8 }} />
          </View>
        )}
        {mode === 'media' && (
          <View style={[box, { padding: 14, marginBottom: 12 }]}>
            {media.length === 0 ? (
              <TouchableOpacity onPress={pickMedia} activeOpacity={0.8} style={{ alignItems: 'center', paddingVertical: 20 }} accessibilityLabel="Choose photos or videos">
                <ProfileIcon name="image" size={30} color={C.muted} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark, marginTop: 8 }}>Tap to choose photos or videos</Text>
                <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Up to {MEDIA_MAX} items</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {media.map((m, i) => (
                    <View key={m.uri} style={{ width: '48%', aspectRatio: 1, marginRight: i % 2 === 0 ? '4%' : 0, marginBottom: 8, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1F1F1F', alignItems: 'center', justifyContent: 'center' }}>
                      {m.type === 'photo' ? <Image source={{ uri: m.uri }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: 28, color: '#fff' }}>▶ Video</Text>}
                      <TouchableOpacity onPress={() => setMedia((x) => x.filter((y) => y.uri !== m.uri))} accessibilityLabel="Remove" style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                        <ProfileIcon name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                {media.length < MEDIA_MAX && (
                  <TouchableOpacity onPress={pickMedia} style={{ alignSelf: 'flex-start', backgroundColor: '#F3F1EA', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>+ Add more</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* Add media / Add link */}
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          {actionCard('#E8F2EA', 'image', '#3E7D4A', 'Add media', 'Photos or video', pickMedia)}
          <View style={{ width: 10 }} />
          {actionCard('#E6EDFB', 'link', '#3D5FC4', 'Add link', 'Paste a URL', () => { setMode('link'); setError(null); })}
        </View>

        {/* Flair & alerts */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {chip('tag', flair ? `Flair: ${flair}` : 'Add flair', !!flair, pickFlair)}
          {chip('bell', alerts ? 'Reply alerts on' : 'Reply alerts off', alerts, () => setAlerts((a) => !a))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <ProfileIcon name="shield" size={14} color="#3E7D4A" />
          <Text style={{ fontSize: 12, color: C.muted, marginLeft: 8, flex: 1 }}>Keep it helpful and campus-safe. {board.name} board rules apply.</Text>
        </View>
        {!!error && <Text style={{ color: C.error, fontSize: 13, fontWeight: '700', marginBottom: 12 }}>{error}</Text>}
        {toast.node}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Publish */}
      <TouchableOpacity onPress={publish} activeOpacity={0.85} style={{ backgroundColor: C.yellow, borderRadius: 18, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 8 }}>
        <ProfileIcon name="send" size={18} />
        <Text style={{ fontSize: 15, fontWeight: '900', color: C.dark, marginLeft: 10 }}>Publish to {board.name}</Text>
      </TouchableOpacity>
      {sheet.node}
    </KeyboardAvoidingView>
  );
}
