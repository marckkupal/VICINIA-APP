import { useEffect, useState } from 'react';
import type { BoardPost } from './boardData';

// Posts people publish to each board. Kept in memory for the session, so they stay when you leave and re-open a board.
// Swap for a backend or AsyncStorage (see storage.ts) to keep them across restarts.
const store: Record<string, BoardPost[]> = {};
const listeners = new Set<() => void>();

export const addBoardPost = (boardId: string, post: BoardPost) => {
  store[boardId] = [post, ...(store[boardId] ?? [])];
  listeners.forEach((l) => l());
};

export function useBoardPosts(boardId: string): BoardPost[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return store[boardId] ?? [];
}
