import { EXPLORE_SCOPE, PLACES, inExploreScope } from './data';
import { CAMPUSES, campusById, resolvePin, usableCampus } from './geo';
import type { Campus } from './geo';
import type { Place } from './data';
import { addBoardPostAsync } from './boardPosts';
import { acct, createPersistedList } from './persist';
import type { Board, Post, PostLocation, TabKey, User } from './types';

// Destination semantics (audit result)
// - Home    -> a Post with destination 'home', saved per account (homePosts).
// - Explore -> a Post with destination 'explore' AND a required `location`, saved per account (pagePosts, key `${account}|explore`).
// - Board   -> a BoardPost in its own collection, partitioned by board_id (boardPosts.ts). A board is a community, not a tag.
// Events are a separate model (CampusEvent: date, time, venue, fee) with their own form (PostEvent), so they are not a destination here.
// Until Firestore is wired up all three are saved on this device. Swap the three `add*Async` calls in `submitPost` for backend writes.

export type DestinationType = 'home' | 'board' | 'explore';
export interface ComposeTarget { type: DestinationType; boardId?: string }

export const DESTINATIONS: { key: DestinationType; label: string; emoji: string }[] = [
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'board', label: 'Board', emoji: '👥' },
  { key: 'explore', label: 'Explore', emoji: '🧭' },
];

export const HOME_TAGS = ['General', 'Study', 'Events', 'Food'];
export const EXPLORE_TAGS = ['Food', 'Study', 'Hangout', 'Tip'];
export const BOARD_FLAIRS = ['Discussion', 'Question', 'Event', 'Showcase', 'Tip'];
export const POST_TINTS = ['#FBF0C4', '#E3F0E4', '#E6E9F8', '#F8E9E5'];

export const TITLE_MAX = 150;
export const BODY_MAX = 1000;
export const MEDIA_MAX = 4;
export const LOCATION_MIN = 3;
export const LOCATION_MAX = 80;

// Posts made on Home and Explore. Saved on this device, per account (Explore also per page).
export const homePosts = createPersistedList<Post>('vicinia_home_posts');
export const pagePosts = createPersistedList<Post>('vicinia_page_posts');
export const explorePostsKey = (email?: string | null) => `${acct(email)}|explore`;

// Which destination the composer opens on, from where it was triggered.
// Inside a board -> that board. Boards tab -> boards. Explore tab -> Explore. Anywhere else (Home) -> Home.
export function defaultDestination(ctx: { tab: TabKey; boardId?: string }): ComposeTarget {
  if (ctx.boardId) return { type: 'board', boardId: ctx.boardId };
  if (ctx.tab === 'explore') return { type: 'explore' };
  if (ctx.tab === 'boards') return { type: 'board' };
  return { type: 'home' };
}

// Which board the composer pre-selects: the one asked for, else a board the person joined, else the first board.
export function resolveBoard<B extends { id: string }>(initial: ComposeTarget, boards: B[], joinedIds: string[]): B | undefined {
  return boards.find((b) => b.id === initial.boardId) ?? boards.find((b) => joinedIds.includes(b.id)) ?? boards[0];
}

// ---- Explore location rules ----

// A known place counts as inside the Explore area when its listed distance is in range AND, if it carries coordinates,
// those coordinates pass its campus geofence (geo.ts). A bad or out-of-area coordinate on a VERIFIED campus is rejected.
// When the campus is not verified yet the geofence cannot judge, so the listed distance decides: tagging a place on a post
// keeps working either way (the coordinate is then simply not saved on the post, see locationOf).
export const placeInScope = (p: Place, campuses: Campus[] = CAMPUSES) => {
  if (!inExploreScope(p.distance)) return false;
  if (p.coord == null) return true;
  if (!usableCampus(campusById(p.campusId, campuses))) return true;
  return resolvePin(p, campuses).ok;
};
export const scopedPlaces = () => PLACES.filter((p) => placeInScope(p));

const LOCATION_CHARS = /^[A-Za-z0-9\u00C0-\u024F][A-Za-z0-9\u00C0-\u024F &'’.,\-()/#]*$/;

// ---- Draft, validation ----

export type DraftMedia = { uri: string; type: 'photo' | 'video' };
export type DraftMode = 'post' | 'media' | 'link';
export interface PostDraft {
  destination: DestinationType;
  boardId?: string;
  tag?: string;      // Home / Explore
  flair?: string;    // Board
  mode: DraftMode;
  title: string; body: string; link: string;
  media: DraftMedia[];
  alerts: boolean;   // Board reply alerts
  location?: { placeId?: string; name: string }; // Explore
}
export type PostErrors = Partial<Record<'form' | 'title' | 'body' | 'link' | 'media' | 'board' | 'tag' | 'location', string>>;

export const isValidLink = (s: string) => /^https?:\/\/\S+\.\S+/i.test(s.trim());

// Returns {} when the draft is good. `boards` is every board the person could post to.
export function validateDraft(d: PostDraft, ctx: { user?: User | null; boards: Board[] }): PostErrors {
  const e: PostErrors = {};
  if (!ctx.user?.email) e.form = 'Log in with your school account to post.';

  const title = d.title.trim();
  if (!title) e.title = 'Add a title for your post.';
  else if (title.length > TITLE_MAX) e.title = `Keep the title under ${TITLE_MAX} characters.`;
  if (d.body.length > BODY_MAX) e.body = `Keep the text under ${BODY_MAX} characters.`;

  if (d.mode === 'link' && !isValidLink(d.link)) e.link = 'Paste a valid link that starts with http:// or https://';
  if (d.mode === 'media') {
    if (d.media.length === 0) e.media = 'Add at least one photo or video, or switch to Post.';
    else if (d.media.length > MEDIA_MAX) e.media = `You can add up to ${MEDIA_MAX} items.`;
    else if (d.destination !== 'board' && d.media.some((m) => m.type === 'video')) e.media = 'Videos can only be posted to a board. Remove the video or choose a board.';
  }

  if (d.destination === 'board') {
    if (!d.boardId || !ctx.boards.some((b) => b.id === d.boardId)) e.board = 'Choose a board to post to.';
  } else {
    const tags = d.destination === 'explore' ? EXPLORE_TAGS : HOME_TAGS;
    if (!d.tag || !tags.includes(d.tag)) e.tag = 'Pick a tag.';
  }

  if (d.destination === 'explore') {
    const loc = d.location;
    if (!loc || (!loc.placeId && !loc.name.trim())) e.location = 'Choose where this is. Explore posts need a location.';
    else if (loc.placeId) {
      const place = PLACES.find((p) => p.id === loc.placeId);
      if (!place) e.location = 'That place could not be found. Choose another location.';
      else if (!placeInScope(place)) e.location = `${place.name} is outside the ${EXPLORE_SCOPE.maxDistanceKm} km Explore area around ${EXPLORE_SCOPE.campus}.`;
    } else {
      const name = loc.name.trim();
      if (name.length < LOCATION_MIN) e.location = `Enter at least ${LOCATION_MIN} characters for the location.`;
      else if (name.length > LOCATION_MAX) e.location = `Keep the location under ${LOCATION_MAX} characters.`;
      else if (!LOCATION_CHARS.test(name)) e.location = 'Use letters and numbers for the location name.';
    }
  }
  return e;
}

// ---- Submit ----

export interface PostResult { destination: DestinationType; board?: Board; label: string }
export class PostError extends Error {
  fields: PostErrors;
  constructor(message: string, fields: PostErrors = {}) { super(message); this.fields = fields; }
}

const newId = () => `me-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clean = (s: string) => s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const inFlight = new Set<string>(); // blocks the same post being sent twice, even if the composer is reopened mid-save

function locationOf(loc: NonNullable<PostDraft['location']>): PostLocation {
  const place = loc.placeId ? PLACES.find((p) => p.id === loc.placeId) : undefined;
  if (place) return { name: place.name, placeId: place.id, ...(resolvePin(place).ok ? place.coord : {}) };
  return { name: loc.name.replace(/\s+/g, ' ').trim() };
}

function buildPost(d: PostDraft, user: User, tintIdx: number): Post {
  const name = user.name ?? 'You';
  const ini = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ME';
  const photos = d.mode === 'media' ? d.media.filter((m) => m.type === 'photo').map((m) => m.uri) : [];
  const body = clean(d.body);
  return {
    id: newId(), name, ini, handle: `@${name.toLowerCase().replace(/\s+/g, '')}`, avatarBg: '#FDF1C4',
    tag: d.tag ?? '', title: d.title.trim(), tint: POST_TINTS[tintIdx % POST_TINTS.length], likes: 0, comments: 0,
    destination: d.destination === 'explore' ? 'explore' : 'home', authorEmail: user.email.trim().toLowerCase(),
    ...(body ? { body } : {}),
    ...(d.mode === 'link' ? { link: d.link.trim() } : {}),
    ...(photos.length ? { media: photos } : {}),
    ...(d.destination === 'explore' && d.location ? { location: locationOf(d.location) } : {}),
  };
}

// Validates again (never trust the form alone), then saves to the right collection. Rejects with a PostError the composer can show.
export async function submitPost(draft: PostDraft, ctx: { user?: User | null; boards: Board[] }): Promise<PostResult> {
  const fields = validateDraft(draft, ctx);
  if (Object.keys(fields).length) throw new PostError(fields.form ?? 'Check the highlighted fields.', fields);
  const user = ctx.user as User; // validateDraft guarantees it

  const key = [acct(user.email), draft.destination, draft.boardId ?? '', draft.title.trim().toLowerCase(), clean(draft.body)].join('|');
  if (inFlight.has(key)) throw new PostError('Your post is already being sent.');
  inFlight.add(key);
  try {
    if (draft.destination === 'board') {
      const board = ctx.boards.find((b) => b.id === draft.boardId) as Board;
      const media = draft.mode === 'media' ? draft.media : [];
      await addBoardPostAsync(board.id, {
        id: newId(), boardId: board.id, author: user.name ?? 'You', authorEmail: user.email.trim().toLowerCase(), ago: 'just now', votes: 0, replies: 0,
        title: draft.title.trim(), text: clean(draft.body), flair: draft.flair || undefined,
        link: draft.mode === 'link' ? draft.link.trim() : undefined, alerts: draft.alerts, media: media.length ? media : undefined,
      });
      return { destination: 'board', board, label: board.name };
    }
    const tags = draft.destination === 'explore' ? EXPLORE_TAGS : HOME_TAGS;
    const post = buildPost(draft, user, Math.max(0, tags.indexOf(draft.tag ?? '')));
    if (draft.destination === 'explore') await pagePosts.addAsync(explorePostsKey(user.email), post);
    else await homePosts.addAsync(acct(user.email), post);
    return { destination: draft.destination, label: draft.destination === 'explore' ? 'Explore' : 'your Home feed' };
  } catch (e) {
    if (e instanceof PostError) throw e;
    throw new PostError('We couldn’t save your post. Check your device storage and try again.');
  } finally {
    inFlight.delete(key);
  }
}
