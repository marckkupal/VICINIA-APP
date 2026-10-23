import { useEffect, useState } from 'react';
import { Alert, Image, View, Text, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { PostCard } from './PostCard';
import { s } from '../styles';
import { C } from '../theme';
import type { Post, User } from '../types';

export type PostPage = 'explore' | 'boards' | 'events';
export const POST_TINTS = ['#FBF0C4', '#E3F0E4', '#E6E9F8', '#F8E9E5'];
const PHOTO_MAX = 4;

// Pop-up used by every "+" button to write a post.
export function PostComposerModal({ visible, onClose, onSubmit, tags, placeholder = 'Share something with the community…' }: {
  visible: boolean; onClose: () => void; onSubmit: (text: string, tagIdx: number, media: string[]) => void; tags: string[]; placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const [tagIdx, setTagIdx] = useState(0);
  const [error, setError] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const close = () => { setDraft(''); setTagIdx(0); setError(false); setPhotos([]); onClose(); };
  const submit = () => {
    if (!draft.trim() && photos.length === 0) return setError(true);
    onSubmit(draft.trim(), tagIdx, photos);
    close();
  };
  const pickPhotos = async () => {
    if (photos.length >= PHOTO_MAX) return Alert.alert('Limit reached', `You can add up to ${PHOTO_MAX} photos.`);
    const r = await launchImageLibrary({ mediaType: 'photo', selectionLimit: PHOTO_MAX - photos.length, quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
    if (r.didCancel) return;
    if (r.errorCode) return Alert.alert('Could not open photos', r.errorMessage ?? 'Please try again.');
    const picked = (r.assets ?? []).map((a) => a.uri).filter((u): u is string => !!u);
    setPhotos((cur) => [...cur, ...picked].slice(0, PHOTO_MAX));
    setError(false);
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: C.dark, marginBottom: 8 }}>New post</Text>
          <TextInput value={draft} onChangeText={(t) => { setDraft(t); setError(false); }} multiline autoFocus maxLength={140} placeholder={placeholder} placeholderTextColor="#A5A296" style={{ minHeight: 80, fontSize: 14, color: C.dark, textAlignVertical: 'top' }} />
          {error && <Text style={{ color: '#D64545', fontSize: 12, marginTop: 4 }}>Write something or add a photo first.</Text>}
          {photos.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {photos.map((uri) => (
                <View key={uri} style={{ marginRight: 8, marginBottom: 8 }}>
                  <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: '#F3F1EA' }} />
                  <TouchableOpacity
                    onPress={() => setPhotos((cur) => cur.filter((u) => u !== uri))}
                    accessibilityLabel="Remove photo"
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginTop: -1 }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity onPress={pickPhotos} accessibilityLabel="Add photo" style={{ alignSelf: 'flex-start', backgroundColor: '#F3F1EA', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, marginTop: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: C.dark }}>🖼️  Add photo{photos.length > 0 ? ` (${photos.length}/${PHOTO_MAX})` : ''}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {tags.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTagIdx(i)} style={{ backgroundColor: i === tagIdx ? C.yellow : '#F3F1EA', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.dark }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={[s.muted, { flex: 1, fontSize: 12 }]}>{draft.length}/140</Text>
            <TouchableOpacity onPress={close} style={{ paddingHorizontal: 14, paddingVertical: 8 }}><Text style={s.seeAll}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={submit} style={{ backgroundColor: C.yellow, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8 }}><Text style={{ fontWeight: '800', fontSize: 13, color: C.dark }}>Post</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Posts live in memory for the session, per page, so they survive switching tabs.
// Swap this for a backend or AsyncStorage (see storage.ts) to keep them across restarts.
const store: Record<PostPage, Post[]> = { explore: [], boards: [], events: [] };
const listeners = new Set<() => void>();
const addPost = (page: PostPage, p: Post) => { store[page] = [p, ...store[page]]; listeners.forEach((l) => l()); };
function usePagePosts(page: PostPage) {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return store[page];
}

export const makePost = (id: string, user: User | null | undefined, text: string, tag: string, tint: string, media: string[] = []): Post => {
  const name = user?.name ?? 'You';
  const ini = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ME';
  return { id, name, ini, handle: `@${name.toLowerCase().replace(/\s+/g, '')}`, avatarBg: '#FDF1C4', tag, title: text, tint, likes: 0, comments: 0, ...(media.length ? { media } : {}) };
};

// Opened by the page's "+" button. Shows the pop-up and lists the posts made on this page.
export function PostSection({ page, user, tags, open, onClose, placeholder }: {
  page: PostPage; user?: User | null; tags: string[]; open: boolean; onClose: () => void; placeholder?: string;
}) {
  const posts = usePagePosts(page);
  return (
    <View>
      <PostComposerModal
        visible={open} onClose={onClose} tags={tags} placeholder={placeholder}
        onSubmit={(text, i, media) => addPost(page, makePost(`${page}-${Date.now()}`, user, text, tags[i], POST_TINTS[i % POST_TINTS.length], media))}
      />
      {posts.length > 0 && <Text style={[s.sectionSub, { marginBottom: 10 }]}>Your posts</Text>}
      {posts.map((p) => <PostCard key={p.id} p={p} />)}
    </View>
  );
}
