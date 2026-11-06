import { useEffect, useMemo, useState } from 'react';
import { acct, loadJSON, saveJSON } from './persist';

// Likes and replies on board posts.
// - Likes are kept per account, so liking a post stays liked after you leave the screen or close the app.
// - Replies you write are kept on this device and shown under the post.
// - The sample posts only store a reply COUNT (e.g. 22), so the thread is filled with clearly-labelled sample replies
//   that match that count. Real replies from other students need a shared backend (Firestore); until then this is prototype data.

export type Reply = { id: string; author: string; text: string; ago: string; sample?: boolean; at?: number };
type Vote = 1 | -1;
type Saved = { likes: Record<string, string[]>; replies: Record<string, Reply[]>; votes?: Record<string, Record<string, Vote>> };

const KEY = 'vicinia_post_activity';
let data: Saved = { likes: {}, replies: {}, votes: {} };
let ready: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const start = () => (ready ??= loadJSON<Saved>(KEY, { likes: {}, replies: {}, votes: {} }).then((saved) => {
  data = {
    likes: saved && typeof saved.likes === 'object' && saved.likes ? saved.likes : {},
    replies: saved && typeof saved.replies === 'object' && saved.replies ? saved.replies : {},
    votes: saved && typeof saved.votes === 'object' && saved.votes ? saved.votes : {},
  };
  emit();
}));
const persist = () => saveJSON(KEY, data);

export const agoLabel = (at?: number) => {
  const m = Math.max(0, Math.round((Date.now() - (at ?? Date.now())) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};
const labelFromMinutes = (m: number) => (m < 1 ? 'just now' : m < 60 ? `${Math.round(m)}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`);

// "2h ago" / "1 hr ago" / "3d ago" -> minutes
const minutesOf = (ago: string) => {
  const m = /(\d+)\s*(m|min|h|hr|hrs|d)/i.exec(ago);
  if (!m) return 0;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  return u.startsWith('d') ? n * 1440 : u.startsWith('h') ? n * 60 : n;
};

// Small seeded random generator, so the same post always shows the same sample replies.
const seeded = (seed: string) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};

const NAMES = ['Maria Santos', 'Luis Reyes', 'Carlo Dizon', 'Angelica Torres', 'Kevin Garcia', 'Mika Reyes', 'Dana Flores', 'Ian Soriano',
  'Hannah Reyes', 'Gab Santiago', 'Jasmine Cortez', 'Migo Tan', 'Lia Cruz', 'Eric Salvador', 'Isabel Lopez', 'Alex Santos'];
const LINES = ['Count me in!', 'What time does this start?', 'Is this open to all year levels?', 'Thanks for sharing, this is super helpful.',
  'Can I bring a friend from another section?', 'Where exactly should we meet?', 'Following this post, please update us!',
  'Love this idea. Let’s make it happen.', 'Does anyone know if there’s a sign-up link?', 'I’ll be there after my last class.',
  'Saving this for later, thank you!', 'Is there a fee, or is it free?', 'Same here, would love to join.', 'Bumping this so more people see it.',
  'Great post. Looking forward to it!', 'Any tips for first-timers?'];

export function sampleReplies(postKey: string, count: number, postAgo: string, postAuthor: string): Reply[] {
  if (count <= 0) return [];
  const rand = seeded(postKey);
  const shuffle = <T,>(arr: T[]) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const names = shuffle(NAMES.filter((n) => n !== postAuthor));
  const lines = shuffle(LINES);
  const span = Math.max(minutesOf(postAgo), 10);
  return Array.from({ length: count }, (_, i) => ({
    id: `s-${postKey}-${i}`,
    author: names[i % names.length],
    text: lines[(i * 3 + Math.floor(i / names.length)) % lines.length], // varies per cycle, so the same name never repeats the same sentence
    ago: labelFromMinutes(span * (count - i) / (count + 1)), // oldest first, all newer than the post
    sample: true,
  }));
}

export function usePostActivity(postKey: string, email: string | null | undefined, post: { replies: number; ago: string; author: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    start();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const me = acct(email);
  const liked = (data.likes[me] ?? []).includes(postKey);
  const vote: 0 | Vote = data.votes?.[me]?.[postKey] ?? 0;
  const mine = data.replies[postKey] ?? [];
  const samples = useMemo(() => sampleReplies(postKey, post.replies, post.ago, post.author), [postKey, post.replies, post.ago, post.author]);
  const replies: Reply[] = [...samples, ...mine.map((r) => ({ ...r, ago: agoLabel(r.at) }))];

  const toggleLike = () => start().then(() => {
    const cur = data.likes[me] ?? [];
    data = { ...data, likes: { ...data.likes, [me]: cur.includes(postKey) ? cur.filter((k) => k !== postKey) : [...cur, postKey] } };
    emit();
    persist();
  });

  // Tap the active arrow again to take your vote back; tap the other arrow to switch.
  const castVote = (dir: Vote) => start().then(() => {
    const mineVotes = { ...(data.votes?.[me] ?? {}) };
    if (mineVotes[postKey] === dir) delete mineVotes[postKey]; else mineVotes[postKey] = dir;
    data = { ...data, votes: { ...(data.votes ?? {}), [me]: mineVotes } };
    emit();
    persist();
  });

  const addReply = (author: string, text: string) => start().then(() => {
    const reply: Reply = { id: `r-${Date.now()}`, author, text: text.trim(), ago: 'just now', at: Date.now() };
    data = { ...data, replies: { ...data.replies, [postKey]: [...(data.replies[postKey] ?? []), reply] } };
    emit();
    persist();
  });

  return { liked, toggleLike, vote, castVote, replies, addReply, hasSample: samples.length > 0 };
}
