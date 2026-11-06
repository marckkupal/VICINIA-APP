import { useEffect, useMemo, useState } from 'react';
import { BOARDS } from './data';
import { categoryNames, styleOf } from './boardCategories';
import { cleanDescription, cleanName, nameKey, validateBoard, type BoardFormErrors } from './boardRules';
import { joinBoard } from './membership';
import { loadJSON, saveJSONStrict } from './persist';
import type { Board } from './types';

// Boards that students create. Each one is a top-level community (a Board), exactly like the built-in ones,
// and is NOT a post inside another board. Posts keep living in boardPosts.ts, keyed by the board's id.
// Saved on this device like posts and events (prototype storage). When Firestore is wired up, replace
// `persist()` below with a write to a `boards` collection; the screens only talk to createBoard / useAllBoards.
const KEY = 'vicinia_user_boards';
let mine: Board[] = [];
let ready: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const inFlight = new Set<string>();

const start = () => (ready ??= loadJSON<Board[]>(KEY, []).then((saved) => {
  const have = new Set(mine.map((b) => b.id));
  const ok = (Array.isArray(saved) ? saved : []).filter((b) => b && typeof b.id === 'string' && typeof b.name === 'string' && !have.has(b.id));
  mine = [...mine, ...ok];
  emit();
}));
start();

export type BoardErrorCode = 'auth' | 'invalid' | 'duplicate' | 'storage';
export class BoardError extends Error {
  code: BoardErrorCode; fields?: BoardFormErrors;
  constructor(code: BoardErrorCode, message: string, fields?: BoardFormErrors) { super(message); this.code = code; this.fields = fields; }
}

export interface CreateBoardInput { name: string; description: string; category: string }

// Sample placeholders never block a real board from using the same name.
const taken = (key: string) => [...BOARDS.filter((b) => !b.sample), ...mine].some((b) => nameKey(b.name) === key || (!!b.label && nameKey(b.label) === key));

// Creates the board, saves it, and makes the creator its first member. Rejects with a BoardError the form can show.
export async function createBoard(user: { email?: string; name?: string } | null | undefined, input: CreateBoardInput): Promise<Board> {
  const email = user?.email?.trim().toLowerCase();
  if (!email) throw new BoardError('auth', 'Log in with your school account to create a board.');

  const fields = validateBoard(input, categoryNames);
  if (Object.keys(fields).length) throw new BoardError('invalid', 'Check the highlighted fields.', fields);

  const name = cleanName(input.name);
  const key = nameKey(name);
  await start(); // make sure boards saved earlier are loaded before checking for a duplicate
  if (inFlight.has(key) || taken(key)) throw new BoardError('duplicate', 'A board with this name already exists.', { name: 'A board with this name already exists. Try a different name.' });
  inFlight.add(key);
  try {
    const look = styleOf({ category: input.category });
    const board: Board = {
      id: `user-board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name, emoji: look.emoji, tint: look.tint, category: look.label,
      description: cleanDescription(input.description),
      members: 0, online: 0, newPosts: 0, // the creator is counted as a member when the board is shown
      createdBy: email, createdByName: user?.name, createdAt: Date.now(),
    };
    const before = mine;
    mine = [board, ...mine];
    try {
      await saveJSONStrict(KEY, mine);
    } catch {
      mine = before; // nothing was saved, so don't show the board
      emit();
      throw new BoardError('storage', 'We couldn’t save your board. Check your device storage and try again.');
    }
    joinBoard(email, board.id);
    emit();
    return board;
  } finally {
    inFlight.delete(key);
  }
}

const EMPTY: Board[] = [];
export function useUserBoards(): Board[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    start();
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return mine.length ? mine : EMPTY;
}

// Every board on campus: the ones students created (newest first) and the built-in ones. Use this instead of BOARDS wherever boards are listed or opened.
export function useAllBoards(): Board[] {
  const created = useUserBoards();
  return useMemo(() => [...created, ...BOARDS], [created]);
}
