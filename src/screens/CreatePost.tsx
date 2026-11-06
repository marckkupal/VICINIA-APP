import { useRef, useState } from 'react';
import { Alert, Image, View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { ProfileIcon } from '../components/ProfileIcon';
import type { ProfileIconName } from '../components/ProfileIcon';
import { Select } from '../components/Select';
import { useActionSheet } from '../components/ActionSheet';
import { useToast } from '../components/Toast';
import { useAllBoards } from '../userBoards';
import { useMembership } from '../membership';
import { EXPLORE_SCOPE } from '../data';
import {
  BOARD_FLAIRS, DESTINATIONS, EXPLORE_TAGS, HOME_TAGS, LOCATION_MAX, MEDIA_MAX, PostError, TITLE_MAX, resolveBoard,
  isValidLink, scopedPlaces, submitPost, validateDraft,
} from '../postTargets';
import type { ComposeTarget, DestinationType, DraftMedia, DraftMode, PostErrors, PostResult } from '../postTargets';
import { PHOTO_OPTIONS, assetUri } from '../persist';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { fmtCount } from '../utils';

const MODES: { key: DraftMode; label: string; icon: ProfileIconName }[] = [
  { key: 'post', label: 'Post', icon: 'textLeft' }, { key: 'media', label: 'Media', icon: 'image' }, { key: 'link', label: 'Link', icon: 'link' },
];
const OTHER_LOCATION = 'Other location…';
const box = { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16 } as const;
const errText = { color: C.error, fontSize: 12, fontWeight: '700', marginTop: 6 } as const;

// The one post composer. Every "+" (Home, Boards, inside a board, Explore) opens this with the destination that matches where the person was.
// `initial` pre-fills the destination (and the board); the person can still change both here.
export function CreatePost({ user, initial, onClose }: { user?: User | null; initial: ComposeTarget; onClose: (posted?: PostResult) => void }) {
  const allBoards = useAllBoards(); // includes boards students created
  const mem = useMembership(user?.email);
  const places = scopedPlaces();
  const fallbackBoard = resolveBoard(initial, allBoards, mem.boards);

  const [dest, setDest] = useState<DestinationType>(initial.type);
  const [boardId, setBoardId] = useState<string | undefined>(fallbackBoard?.id);
  const [tags, setTags] = useState({ home: HOME_TAGS[0], explore: EXPLORE_TAGS[0] });
  const [flair, setFlair] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [customOn, setCustomOn] = useState(false);
  const [customName, setCustomName] = useState('');
  const [mode, setMode] = useState<DraftMode>('post');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [media, setMedia] = useState<DraftMedia[]>([]);
  const [alerts, setAlerts] = useState(true);
  const [errors, setErrors] = useState<PostErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false); // set synchronously, so a fast double tap can't start two saves before `submitting` re-renders
  const sheet = useActionSheet();
  const toast = useToast();

  const board = allBoards.find((b) => b.id === boardId);
  const place = places.find((p) => p.id === placeId);
  const clearErr = (...k: (keyof PostErrors)[]) => setErrors((e) => { const n = { ...e }; k.forEach((x) => delete n[x]); delete n.form; return n; });
  const pickDest = (d: DestinationType) => { if (!submitting) { setDest(d); setErrors({}); } };

  const pickFlair = () => sheet.open('Add flair', [
    ...BOARD_FLAIRS.map((f) => ({ text: f, onPress: () => setFlair(f) })),
    ...(flair ? [{ text: 'Remove flair', destructive: true, onPress: () => setFlair(null) }] : []),
  ]);
  // Formatting buttons add markers at the end of the text (bold = **text**, italic = _text_).
  const addToBody = (snippet: string) => { setMode('post'); setBody((b) => b + snippet); };
  const pickMedia = async () => {
    setMode('media'); clearErr('media');
    if (media.length >= MEDIA_MAX) return Alert.alert('Limit reached', `You can add up to ${MEDIA_MAX} ${dest === 'board' ? 'photos or videos' : 'photos'}.`);
    const r = await launchImageLibrary({ mediaType: dest === 'board' ? 'mixed' : 'photo', selectionLimit: MEDIA_MAX - media.length, ...PHOTO_OPTIONS });
    if (r.didCancel) return;
    if (r.errorCode) return Alert.alert('Could not open photos', r.errorMessage ?? 'Please try again.');
    const picked: DraftMedia[] = (r.assets ?? []).filter((a) => !!a.uri).map((a) => (a.type?.startsWith('video') ? { uri: a.uri as string, type: 'video' as const } : { uri: assetUri(a) as string, type: 'photo' as const }));
    setMedia((m) => [...m, ...picked].slice(0, MEDIA_MAX));
  };

  const location = dest === 'explore' ? { placeId: customOn ? undefined : placeId ?? undefined, name: customOn ? customName : place?.name ?? '' } : undefined;
  // Clears every field so a composer that stays mounted never shows the previous post. (Callers also unmount it.)
  const resetComposer = () => {
    setTitle(''); setBody(''); setLink(''); setMedia([]); setMode('post'); setFlair(null); setPlaceId(null); setCustomOn(false); setCustomName(''); setAlerts(true); setErrors({});
  };
  const publish = async () => {
    if (lock.current) return; // already saving: ignore repeat taps
    const draft = { destination: dest, boardId, tag: dest === 'explore' ? tags.explore : tags.home, flair: flair ?? undefined, mode, title, body, link, media, alerts, location };
    const found = validateDraft(draft, { user, boards: allBoards });
    if (Object.keys(found).length) return setErrors(found);
    lock.current = true; setSubmitting(true); setErrors({});
    try {
      const result = await submitPost(draft, { user, boards: allBoards }); // the post is already visible in its feed (optimistic add inside the store)
      resetComposer();
      onClose(result); // the caller closes the composer and shows the "Posted to …" toast
    } catch (e) {
      setErrors(e instanceof PostError ? { ...e.fields, ...(Object.keys(e.fields).length ? {} : { form: e.message }) } : { form: 'Something went wrong. Please try again.' });
      lock.current = false; setSubmitting(false);
    }
  };
  const target = dest === 'board' ? board?.name ?? 'a board' : dest === 'explore' ? 'Explore' : 'Home';

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
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: on ? '#FDF1C4' : '#fff', borderWidth: 1, borderColor: on ? '#F3E3A0' : C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, marginRight: 8 }}>
      <ProfileIcon name={icon} size={16} color={C.dark} />
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark, marginLeft: 8 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.screen}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <TouchableOpacity onPress={() => onClose()} disabled={submitting} accessibilityLabel="Close" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <ProfileIcon name="close" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: C.dark }}>Create post</Text>
          <Text style={s.libSub}>Share with your campus</Text>
        </View>
        <TouchableOpacity onPress={publish} disabled={submitting} accessibilityState={{ disabled: submitting, busy: submitting }} style={{ backgroundColor: C.yellow, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 11, minHeight: 44, justifyContent: 'center', opacity: submitting ? 0.5 : 1 }}>
          <Text style={{ fontWeight: '900', fontSize: 13, color: C.dark, letterSpacing: 0.5 }}>{submitting ? 'POSTING…' : 'POST'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.fill} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Posting to: summary of the chosen destination */}
        <View style={{ backgroundColor: C.dark, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Text style={{ fontSize: 26 }}>{dest === 'board' ? board?.emoji ?? '👥' : dest === 'explore' ? '🧭' : '🏠'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.yellow }}>POSTING TO</Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>{dest === 'board' ? board?.name ?? 'Choose a board' : dest === 'explore' ? 'Explore nearby' : 'Home feed'}</Text>
            <Text style={{ fontSize: 12, color: '#B8B4A6' }}>
              {dest === 'board' ? (board ? `${fmtCount(board.members + (mem.boards.includes(board.id) ? 1 : 0))} members · Public board` : 'No board selected')
                : dest === 'explore' ? `Places within ${EXPLORE_SCOPE.maxDistanceKm} km of ${EXPLORE_SCOPE.campus}` : 'Shown to the campus on Home'}
            </Text>
          </View>
        </View>

        {/* Destination */}
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {DESTINATIONS.map((d, i) => {
            const on = dest === d.key;
            return (
              <TouchableOpacity key={d.key} onPress={() => pickDest(d.key)} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`Post to ${d.label}`}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: on ? C.yellow : '#fff', borderWidth: 1, borderColor: on ? C.yellow : C.border, marginRight: i < 2 ? 8 : 0 }}>
                <Text style={{ fontSize: 14, marginRight: 6 }}>{d.emoji}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: C.dark }}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {dest === 'board' && (
          <View style={{ marginBottom: 12 }}>
            <Select
              icon={board?.emoji ?? '👥'}
              value={board ? board.name : 'Choose a board'}
              options={allBoards.map((b) => b.name)}
              onChange={(name) => { const b = allBoards.find((x) => x.name === name); if (b) { setBoardId(b.id); clearErr('board'); } }}
            />
            {!!errors.board && <Text style={errText}>{errors.board}</Text>}
          </View>
        )}

        {dest === 'explore' && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.muted, marginBottom: 6 }}>LOCATION (REQUIRED)</Text>
            <Select
              icon="📍"
              value={customOn ? OTHER_LOCATION : place ? place.name : 'Choose a location'}
              options={[...places.map((p) => p.name), OTHER_LOCATION]}
              onChange={(v) => {
                clearErr('location');
                if (v === OTHER_LOCATION) { setCustomOn(true); setPlaceId(null); return; }
                setCustomOn(false); setPlaceId(places.find((p) => p.name === v)?.id ?? null);
              }}
            />
            {customOn && (
              <View style={[box, { padding: 14, marginTop: 8 }]}>
                <TextInput value={customName} onChangeText={(v) => { setCustomName(v); clearErr('location'); }} maxLength={LOCATION_MAX} placeholder="Name of the place or area" placeholderTextColor="#A5A296" style={{ fontSize: 15, color: C.dark, paddingVertical: 6 }} />
              </View>
            )}
            {!!errors.location && <Text style={errText}>{errors.location}</Text>}
          </View>
        )}

        {/* Post / Media / Link */}
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          {MODES.map((m, i) => {
            const on = mode === m.key;
            return (
              <TouchableOpacity key={m.key} onPress={() => { setMode(m.key); clearErr('media', 'link'); }} activeOpacity={0.8}
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
            <TextInput value={title} onChangeText={(t) => { setTitle(t); clearErr('title'); }} maxLength={TITLE_MAX} placeholder="An interesting title" placeholderTextColor="#A5A296" style={{ flex: 1, fontSize: 15, fontWeight: '700', color: C.dark, paddingVertical: 6 }} />
            <Text style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{title.length}/{TITLE_MAX}</Text>
          </View>
          {!!errors.title && <Text style={errText}>{errors.title}</Text>}
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
                <TouchableOpacity key={b.k} onPress={b.on} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F1EA', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>{b.node}</TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {mode === 'link' && (
          <View style={[box, { padding: 14, marginBottom: 12 }]}>
            <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.muted }}>LINK</Text>
            <TextInput value={link} onChangeText={(t) => { setLink(t); clearErr('link'); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://" placeholderTextColor="#A5A296" style={{ fontSize: 15, color: C.dark, paddingVertical: 6 }} />
            {!!errors.link && <Text style={errText}>{errors.link}</Text>}
            <TextInput value={body} onChangeText={setBody} multiline placeholder="Add a note (optional)" placeholderTextColor="#A5A296" style={{ minHeight: 60, fontSize: 14, color: C.dark, textAlignVertical: 'top', marginTop: 8 }} />
          </View>
        )}
        {mode === 'media' && (
          <View style={[box, { padding: 14, marginBottom: 12 }]}>
            {media.length === 0 ? (
              <TouchableOpacity onPress={pickMedia} activeOpacity={0.8} style={{ alignItems: 'center', paddingVertical: 20 }} accessibilityLabel="Choose photos or videos">
                <ProfileIcon name="image" size={30} color={C.muted} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark, marginTop: 8 }}>Tap to choose {dest === 'board' ? 'photos or videos' : 'photos'}</Text>
                <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Up to {MEDIA_MAX} items</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {media.map((m, i) => (
                    <View key={i} style={{ width: '48%', aspectRatio: 1, marginRight: i % 2 === 0 ? '4%' : 0, marginBottom: 8, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1F1F1F', alignItems: 'center', justifyContent: 'center' }}>
                      {m.type === 'photo' ? <Image source={{ uri: m.uri }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: 28, color: '#fff' }}>▶ Video</Text>}
                      <TouchableOpacity onPress={() => setMedia((x) => x.filter((_, j) => j !== i))} accessibilityLabel="Remove" style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                        <ProfileIcon name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                {media.length < MEDIA_MAX && (
                  <TouchableOpacity onPress={pickMedia} style={{ alignSelf: 'flex-start', backgroundColor: '#F3F1EA', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>+ Add more</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {!!errors.media && <Text style={[errText, { marginTop: 0, marginBottom: 10 }]}>{errors.media}</Text>}
        {!!errors.body && <Text style={[errText, { marginTop: 0, marginBottom: 10 }]}>{errors.body}</Text>}

        {/* Add media / Add link */}
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          {actionCard('#E8F2EA', 'image', '#3E7D4A', 'Add media', dest === 'board' ? 'Photos or video' : 'Photos', pickMedia)}
          <View style={{ width: 10 }} />
          {actionCard('#E6EDFB', 'link', '#3D5FC4', 'Add link', 'Paste a URL', () => { setMode('link'); clearErr('link'); })}
        </View>

        {/* Board: flair and reply alerts. Home / Explore: a required tag. */}
        {dest === 'board' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
            {chip('tag', flair ? `Flair: ${flair}` : 'Add flair', !!flair, pickFlair)}
            {chip('bell', alerts ? 'Reply alerts on' : 'Reply alerts off', alerts, () => setAlerts((a) => !a))}
          </View>
        ) : (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.muted, marginBottom: 6 }}>TAG</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {(dest === 'explore' ? EXPLORE_TAGS : HOME_TAGS).map((tg) => {
                const on = (dest === 'explore' ? tags.explore : tags.home) === tg;
                return (
                  <TouchableOpacity key={tg} onPress={() => { setTags((x) => ({ ...x, [dest]: tg })); clearErr('tag'); }} accessibilityState={{ selected: on }}
                    style={{ backgroundColor: on ? C.yellow : '#fff', borderWidth: 1, borderColor: on ? C.yellow : C.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center', marginRight: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>{tg}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!errors.tag && <Text style={errText}>{errors.tag}</Text>}
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <ProfileIcon name="shield" size={14} color="#3E7D4A" />
          <Text style={{ fontSize: 12, color: C.muted, marginLeft: 8, flex: 1 }}>Keep it helpful and campus-safe.{dest === 'board' && board ? ` ${board.name} board rules apply.` : ''}</Text>
        </View>
        {!!errors.form && <Text style={{ color: C.error, fontSize: 13, fontWeight: '700', marginBottom: 12 }}>{errors.form}</Text>}
        {toast.node}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Publish */}
      <TouchableOpacity onPress={publish} disabled={submitting} activeOpacity={0.85} accessibilityState={{ disabled: submitting, busy: submitting }} style={{ backgroundColor: C.yellow, borderRadius: 18, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 8, opacity: submitting ? 0.5 : 1 }}>
        <ProfileIcon name="send" size={18} />
        <Text style={{ fontSize: 15, fontWeight: '900', color: C.dark, marginLeft: 10 }}>{submitting ? 'Posting…' : `Publish to ${target}`}</Text>
      </TouchableOpacity>
      {sheet.node}
    </KeyboardAvoidingView>
  );
}
