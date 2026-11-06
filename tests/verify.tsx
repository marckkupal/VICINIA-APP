import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BOARDS, PLACES } from '../src/data';
import { acct } from '../src/persist';
import { loadBoardPosts, useBoardPosts } from '../src/boardPosts';
import { PostError, defaultDestination, explorePostsKey, homePosts, pagePosts, resolveBoard, submitPost, validateDraft } from '../src/postTargets';

const user: any = { name: 'Ana Cruz', email: 'Ana@tip.edu.ph', university: '', program: '', year: '', password: '' };
const other: any = { name: 'Ben Lim', email: 'ben@tip.edu.ph', university: '', program: '', year: '', password: '' };
const boards: any[] = BOARDS;
const base = { destination: 'home' as const, tag: 'General', mode: 'post' as const, title: 't', body: '', link: '', media: [], alerts: true };
let fails = 0;
const ok = (n: string, c: boolean) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', n); };
const errs = (d: any, u: any = user) => validateDraft({ ...base, ...d }, { user: u, boards });

// What a screen renders for each feed, using the same hooks the screens use.
const Feeds = ({ email }: { email: string }) => {
  const home = homePosts.useItems(acct(email)).map((p) => p.title);
  const explore = pagePosts.useItems(explorePostsKey(email)).map((p) => `${p.title}@${p.location?.name}`);
  const b1 = useBoardPosts(boards[0].id).map((p) => p.title);
  const b2 = useBoardPosts(boards[1].id).map((p) => p.title);
  return h('pre', null, JSON.stringify({ home, explore, b1, b2 }));
};
const feeds = (email: string) => JSON.parse(renderToStaticMarkup(h(Feeds, { email })).replace(/<\/?pre>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'"));
const loadAll = () => Promise.all([homePosts.load(), pagePosts.load(), loadBoardPosts()]);
const tick = () => new Promise((r) => setTimeout(r, 50));

(async () => {
  const phase = process.argv[2];
  if (phase === 'write') {
    console.log('--- 1. "+" trigger -> contextual default ---');
    ok('Home "+" -> Home', defaultDestination({ tab: 'home' }).type === 'home');
    ok('Posts feed ("For you", Home tab) "+" -> Home', defaultDestination({ tab: 'home' }).type === 'home');
    ok('Explore "+" -> Explore', defaultDestination({ tab: 'explore' }).type === 'explore');
    ok('Boards tab "+" -> board destination', defaultDestination({ tab: 'boards' }).type === 'board');
    ok('inside a board "+" -> that board id', defaultDestination({ tab: 'boards', boardId: boards[1].id }).boardId === boards[1].id);
    ok('board opened from Home route also pre-fills that board', defaultDestination({ tab: 'home', boardId: boards[1].id }).boardId === boards[1].id);
    ok('Boards tab pre-selects featured board', resolveBoard(defaultDestination({ tab: 'boards', boardId: boards[2].id }), boards, [])?.id === boards[2].id);
    ok('no board given -> joined board wins', resolveBoard({ type: 'board' }, boards, [boards[3].id])?.id === boards[3].id);
    ok('no board, none joined -> first board', resolveBoard({ type: 'board' }, boards, [])?.id === boards[0].id);

    console.log('--- 2. Validation ---');
    ok('Explore: missing location rejected', !!errs({ destination: 'explore', tag: 'Food' }).location);
    ok('Explore: blank custom location rejected', !!errs({ destination: 'explore', tag: 'Food', location: { name: '   ' } }).location);
    ok('Explore: out-of-area place rejected', !!errs({ destination: 'explore', tag: 'Food', location: { placeId: '4', name: '' } }).location);
    ok('Explore: unknown place id rejected', !!errs({ destination: 'explore', tag: 'Food', location: { placeId: 'zzz', name: '' } }).location);
    ok('Explore: in-area place accepted', !errs({ destination: 'explore', tag: 'Food', location: { placeId: '1', name: '' } }).location);
    ok('Boards: missing board_id rejected', !!errs({ destination: 'board' }).board);
    ok('Boards: unknown board_id rejected', !!errs({ destination: 'board', boardId: 'nope' }).board);
    ok('Boards: valid board_id accepted', !errs({ destination: 'board', boardId: boards[0].id }).board);
    ok('Home: missing tag rejected', !!errs({ tag: undefined }).tag);
    ok('Explore tag from Home list rejected', !!errs({ destination: 'explore', tag: 'General', location: { placeId: '1', name: '' } }).tag);
    ok('empty title rejected (any destination)', !!errs({ title: ' ' }).title);
    ok('logged-out rejected', !!errs({}, null).form);
    for (const d of [{ destination: 'explore', tag: 'Food' }, { destination: 'board' }]) {
      try { await submitPost({ ...base, ...d } as any, { user, boards }); ok('submit rejects invalid ' + d.destination, false); }
      catch (e) { ok('submitPost re-validates: ' + d.destination, e instanceof PostError && Object.keys(e.fields).length > 0); }
    }
    ok('nothing saved by rejected submits', JSON.stringify(feeds('ana@tip.edu.ph')) === JSON.stringify({ home: [], explore: [], b1: [], b2: [] }));

    console.log('--- 3. Persistence + feed rendering (write) ---');
    const ctx = { user, boards };
    // Two simultaneous taps on the same post: only one may be saved.
    const dup = { ...base, title: 'Home post' };
    const r = await Promise.allSettled([submitPost(dup, ctx), submitPost(dup, ctx)]);
    ok('double submit saves exactly once', r.filter((x) => x.status === 'fulfilled').length === 1);
    await submitPost({ ...base, destination: 'explore', tag: 'Food', title: 'Explore post', location: { placeId: '1', name: '' } }, ctx);
    await submitPost({ ...base, destination: 'board', boardId: boards[0].id, title: 'Board A post' }, ctx);
    await submitPost({ ...base, destination: 'board', boardId: boards[1].id, title: 'Board B post', flair: 'Tip' }, ctx);
    await tick();
    const f = feeds('ana@tip.edu.ph');
    ok('Home feed shows only the Home post', JSON.stringify(f.home) === '["Home post"]');
    ok('Explore feed shows the post with its location', JSON.stringify(f.explore) === `["Explore post@${PLACES[0].name}"]`);
    ok('Board A feed shows only its post', JSON.stringify(f.b1) === '["Board A post"]');
    ok('Board B feed shows only its post (partitioned by board_id)', JSON.stringify(f.b2) === '["Board B post"]');
    ok("another account's Home/Explore feeds stay empty", feeds(other.email).home.length === 0 && feeds(other.email).explore.length === 0);
  } else if (phase === 'read') {
    console.log('--- 3. Persistence + feed rendering (after app restart) ---');
    await loadAll(); // what the screens' useItems effect does on first render
    const f = feeds('ana@tip.edu.ph');
    ok('Home post survived restart', JSON.stringify(f.home) === '["Home post"]');
    ok('Explore post + location survived restart', f.explore.length === 1 && f.explore[0].endsWith(PLACES[0].name));
    ok('Board posts survived restart, in the right boards', f.b1[0] === 'Board A post' && f.b2[0] === 'Board B post');
    ok('accounts stay separate after restart', feeds(other.email).home.length === 0);
  } else if (phase === 'fail') {
    console.log('--- 4. Failed save ---');
    await loadAll();
    const before = JSON.stringify(feeds('ana@tip.edu.ph'));
    try { await submitPost({ ...base, title: 'Should not stick' }, { user, boards }); ok('failed save rejects', false); }
    catch (e) { ok('failed save rejects with a PostError the composer shows', e instanceof PostError); }
    ok('optimistic post rolled back from the feed', JSON.stringify(feeds('ana@tip.edu.ph')) === before);
  }
  process.exit(fails ? 1 : 0);
})();
