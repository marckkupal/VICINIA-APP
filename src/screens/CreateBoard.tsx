import { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BoardCard } from '../components/BoardCard';
import { Field } from '../components/Field';
import { LibPage } from '../components/LibPage';
import { PrimaryButton } from '../components/PrimaryButton';
import { useToast } from '../components/Toast';
import { BOARD_CATEGORIES, styleOf } from '../boardCategories';
import { BOARD_DESC_MAX, BOARD_NAME_MAX, cleanDescription, cleanName, validateBoard } from '../boardRules';
import { BoardError, createBoard } from '../userBoards';
import { s } from '../styles';
import { C } from '../theme';
import type { Board, User } from '../types';

const NAMES = BOARD_CATEGORIES.map((c) => c.label);

// Creates a new board: a top-level community that shows up in Campus boards next to the others. It is not a post.
export function CreateBoard({ user, initialName, onBack, onCreated }: { user?: User | null; initialName?: string; onBack: () => void; onCreated: (b: Board) => void }) {
  const [name, setName] = useState(initialName ?? '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ name?: string }>({});
  const lock = useRef(false); // blocks a second submit in the same instant, before `busy` has re-rendered
  const toast = useToast();

  // Errors appear after the first attempt to submit, then update as the person fixes each field.
  const found = validateBoard({ name, description, category }, NAMES);
  const nameErr = (tried ? found.name : undefined) ?? serverErrors.name;
  const descErr = tried ? found.description : undefined;
  const catErr = tried ? found.category : undefined;

  const submit = async () => {
    if (lock.current) return;
    setTried(true);
    if (Object.keys(found).length) return toast.error('Check the highlighted fields.');
    lock.current = true;
    setBusy(true);
    try {
      const board = await createBoard(user, { name, description, category });
      onCreated(board); // the form closes here, so nothing below runs on success
      return;
    } catch (e) {
      if (e instanceof BoardError) {
        if (e.code === 'duplicate' || e.code === 'invalid') setServerErrors({ name: e.fields?.name });
        toast.error(e.message);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    }
    lock.current = false;
    setBusy(false);
  };

  const preview: Board = {
    id: 'preview', name: cleanName(name) || 'Your board name', emoji: styleOf({ category }).emoji, category: category || 'Other',
    description: cleanDescription(description) || 'What your board is about shows here.', members: 0,
  };

  return (
    <LibPage
      title="Create a board"
      sub="Start a community for TIP QC students"
      onBack={onBack}
      footer={<PrimaryButton label="Create board" onPress={submit} busy={busy} />}
    >
      {toast.node}
      <View style={[s.infoCard, { marginTop: 4 }]}>
        <Text style={s.infoCardText}>A board is its own community that students can find, join and post in. You will be its first member and admin.</Text>
      </View>

      <Field
        label="Board name" value={name} onChangeText={(t) => { setName(t); if (serverErrors.name) setServerErrors({}); }}
        placeholder="e.g. Chess Club" autoCapitalize="words" maxLength={BOARD_NAME_MAX} errorText={nameErr}
        helper={`${cleanName(name).length}/${BOARD_NAME_MAX}`} />

      <Field
        label="Description" value={description} onChangeText={setDescription}
        placeholder="What is this board for? Who should join?" autoCapitalize="sentences" multiline maxLength={BOARD_DESC_MAX} errorText={descErr}
        helper={`${description.length}/${BOARD_DESC_MAX}`} />

      <Text style={s.fieldLabel}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: catErr ? 4 : 14 }}>
        {BOARD_CATEGORIES.map((c) => {
          const on = category === c.label;
          return (
            <TouchableOpacity
              key={c.label}
              onPress={() => setCategory(c.label)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8, backgroundColor: on ? C.dark : '#fff', borderWidth: 1, borderColor: on ? C.dark : C.border }}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>{c.emoji}</Text>
              <Text style={{ fontSize: 13, fontWeight: on ? '800' : '600', color: on ? '#fff' : C.dark }}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!!catErr && <Text style={s.fieldErrorText}>{catErr}</Text>}

      <Text style={[s.fieldLabel, { marginTop: 6 }]}>Preview</Text>
      <BoardCard board={preview} members={1} joined preview />
    </LibPage>
  );
}
