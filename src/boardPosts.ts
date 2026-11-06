import type { BoardPost } from './boardData';
import { createPersistedList } from './persist';

// Posts people publish to each board. Saved on this device, so they are still there after the app is closed.
// (Prototype storage: swap for a backend so posts are visible to every student.)
const list = createPersistedList<BoardPost>('vicinia_board_posts');

export const addBoardPost = (boardId: string, post: BoardPost) => list.add(boardId, post);
// Resolves once saved; rejects (and removes the post) if saving fails.
export const addBoardPostAsync = (boardId: string, post: BoardPost) => list.addAsync(boardId, post);
export const useBoardPosts = (boardId: string): BoardPost[] => list.useItems(boardId);
export const loadBoardPosts = () => list.load();
