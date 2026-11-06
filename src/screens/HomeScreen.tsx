import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Keyboard } from 'react-native';
import { KeyboardScroll } from '../components/KeyboardAware';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { LineIcon } from '../components/LineIcon';
import { OfficeIcon } from '../components/OfficeIcon';
import type { OfficeIconName } from '../components/OfficeIcon';
import { SearchBar } from '../components/SearchBar';
import { PostCard } from '../components/PostCard';
import { acct } from '../persist';
import { defaultDestination, homePosts } from '../postTargets';
import { PLACES, POSTS, QUICK } from '../data';
import { useAllEvents } from '../userEvents';
import { useAllBoards } from '../userBoards';
import { setNotifUser, useNotifications } from '../notifications';
import type { NotifTarget } from '../notifications';
import { goToTab, openInTab } from '../navigation';
import { maybeStartTour, setTarget } from '../tour';
import { PEOPLE, personOf } from '../people';
import { registerEvent, setActiveUser, toggleSavedPlace, unregisterEvent, useMembership } from '../membership';
import { s } from '../styles';
import { C } from '../theme';
import type { TabKey, User } from '../types';
import { ChatScreen } from './ChatScreen';
import { CreatePost } from './CreatePost';
import { ClinicScreen } from './ClinicScreen';
import { EventDetails, RegistrationPreview } from './EventDetails';
import { BoardDetail } from './BoardDetail';
import { GuidanceScreen } from './GuidanceScreen';
import { LibraryScreen } from './LibraryScreen';
import { MemberProfile } from './MemberProfile';
import { NotificationsPage } from './NotificationsPage';
import { OSAScreen } from './OSAScreen';
import { PlaceDetails, PlaceDirections } from './PlaceDetails';
import { NotificationsScreen } from './ProfileSettings';

const QUICK_ICON: Record<string, OfficeIconName> = { Guidance: 'heart', Library: 'bookOpen', Clinic: 'crossOutline', OSA: 'cap' };

// Pages opened from Home. Back always returns to the page that opened it (e.g. Notifications).
type Route =
  | { k: 'library' } | { k: 'clinic' } | { k: 'osa' } | { k: 'guidance' } | { k: 'notifications' } | { k: 'notifPrefs' }
  | { k: 'member'; id: string } | { k: 'chat'; id: string } | { k: 'board'; id: string }
  | { k: 'event'; id: string; registered?: boolean } | { k: 'place'; id: string; directions?: boolean };

// Extra words that should also find each office, and the app pages the search can jump to.
const OFFICE_WORDS: Record<string, string[]> = {
  Guidance: ['counseling', 'counselling', 'appointment'],
  Library: ['books', 'borrow', 'booking', 'study room'],
  Clinic: ['health', 'medical', 'nurse', 'doctor'],
  OSA: ['student affairs', 'organizations', 'clubs'],
};
const APP_PAGES: { title: string; icon: string; words: string[]; tab?: TabKey; route?: Route }[] = [
  { title: 'Explore', icon: '🧭', words: ['places', 'map', 'nearby', 'cafe', 'food'], tab: 'explore' },
  { title: 'Boards', icon: '👥', words: ['communities', 'community', 'clubs', 'groups'], tab: 'boards' },
  { title: 'Events', icon: '📅', words: ['calendar', 'register', 'schedule'], tab: 'events' },
  { title: 'My profile', icon: '🙋', words: ['account', 'settings', 'saved'], tab: 'profile' },
  { title: 'Notifications', icon: '🔔', words: ['alerts', 'updates'], route: { k: 'notifications' } },
];

const QUICK_ROUTE: Record<string, Route> = {
  Library: { k: 'library' }, Clinic: { k: 'clinic' }, OSA: { k: 'osa' }, Guidance: { k: 'guidance' },
};

export function HomeScreen({ user, goProfile }: { user: User; goProfile: () => void }) {
  const [stack, setStack] = useState<Route[]>([]);
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [composing, setComposing] = useState(false);
  const myPosts = homePosts.useItems(acct(user.email));
  setActiveUser(user.email);
  setNotifUser(user.email);
  const mem = useMembership(user.email);
  useEffect(() => { maybeStartTour(user.email); }, [user.email]); // first-time walkthrough; no-op once completed or skipped
  const allEvents = useAllEvents(); // sample events + events people posted
  const allBoards = useAllBoards(); // built-in boards + boards people created
  const allPlaces = PLACES;
  const { unread } = useNotifications();
  const route = stack[stack.length - 1];
  const push = (r: Route) => setStack((st) => [...st, r]);
  const back = () => setStack((st) => st.slice(0, -1));
  const replaceTop = (r: Route) => setStack((st) => [...st.slice(0, -1), r]);

  const openTarget = (t: NotifTarget) => {
    switch (t.kind) {
      case 'profile': return push({ k: 'member', id: t.personId });
      case 'message': return push({ k: 'chat', id: t.personId });
      case 'board': return push({ k: 'board', id: t.boardId });
      case 'event': return push({ k: 'event', id: t.eventId });
      case 'place': return push({ k: 'place', id: t.placeId });
      case 'library': return push({ k: 'library' });
      case 'myProfile': setStack([]); return goProfile(); // leave Notifications so Home isn't stuck on it later
    }
  };

  const feed = [...myPosts, ...POSTS];
  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  // -1 = no match. Every typed word must appear somewhere in the title or details.
  // Lower is better: 0 title starts with the text, 1 a title word starts with it, 2 title contains it, 3 only the details match.
  const rank = (title: string, ...more: (string | undefined)[]) => {
    const t = title.toLowerCase();
    const hay = [title, ...more].filter(Boolean).join(' ').toLowerCase();
    if (!words.every((w) => hay.includes(w))) return -1;
    if (t.startsWith(q)) return 0;
    if (t.split(/\s+/).some((w) => w.startsWith(q))) return 1;
    return t.includes(q) ? 2 : 3;
  };
  type Hit = { key: string; icon: string; title: string; sub: string; go: () => void };
  const hits: (Hit & { r: number })[] = [];
  const add = (r: number, h: Hit) => { if (r >= 0) hits.push({ ...h, r }); };
  if (q) {
    QUICK.forEach((o) => add(rank(o.label, 'campus office', ...(OFFICE_WORDS[o.label] ?? [])), { key: `o-${o.label}`, icon: o.icon, title: o.label, sub: 'Campus office', go: () => QUICK_ROUTE[o.label] && push(QUICK_ROUTE[o.label]) }));
    allPlaces.forEach((p) => add(rank(p.name, p.type), { key: `p-${p.id}`, icon: p.emoji, title: p.name, sub: `Place · ${p.type}`, go: () => { openInTab('explore', { kind: 'place', id: p.id }); setQuery(''); } }));
    allEvents.forEach((e) => add(rank(e.title, e.venue, e.kind, e.dateShort), { key: `e-${e.id}`, icon: e.icon, title: e.title, sub: `Event · ${e.dateShort}`, go: () => { openInTab('events', { kind: 'event', id: e.id }); setQuery(''); } }));
    allBoards.forEach((b) => add(rank(b.name, b.label, b.tagline, b.category, b.description), { key: `b-${b.id}`, icon: b.emoji, title: b.name, sub: b.sample ? `Community · ${b.sampleLabel ?? '[Sample]'}` : `Community · ${b.members} members`, go: () => { openInTab('boards', { kind: 'board', id: b.id }); setQuery(''); } }));
    Object.values(PEOPLE).forEach((m) => add(rank(m.name, m.handle, m.program, ...m.interests), { key: `m-${m.id}`, icon: '👤', title: m.name, sub: `Student · ${m.program}, ${m.year}`, go: () => push({ k: 'member', id: m.id }) }));
    APP_PAGES.forEach((a) => add(rank(a.title, ...a.words), { key: `a-${a.title}`, icon: a.icon, title: a.title, sub: 'Page', go: () => {
      if (a.tab === 'profile') goProfile();
      else if (a.tab) goToTab(a.tab);
      else if (a.route) push(a.route);
      if (a.tab) setQuery('');
    } }));
  }
  const results: Hit[] = hits.sort((a, b) => a.r - b.r).slice(0, 30);

  if (route) {
    switch (route.k) {
      case 'library': return <LibraryScreen user={user} onBack={back} />;
      case 'clinic': return <ClinicScreen onBack={back} />;
      case 'osa': return <OSAScreen user={user} onBack={back} onOpenEvent={(id) => push({ k: 'event', id })} />;
      case 'guidance': return <GuidanceScreen user={user} onBack={back} onOpenEvents={() => goToTab('events')} />;
      case 'notifications': return <NotificationsPage onBack={back} onOpen={openTarget} onSettings={() => push({ k: 'notifPrefs' })} />;
      case 'notifPrefs': return <NotificationsScreen onBack={back} email={user.email} />;
      case 'member': {
        const person = personOf(route.id);
        if (person) return <MemberProfile person={person} onBack={back} onMessage={() => push({ k: 'chat', id: person.id })} />;
        break;
      }
      case 'chat': {
        const person = personOf(route.id);
        if (person) return <ChatScreen person={person} onBack={back} />;
        break;
      }
      case 'board': {
        const board = allBoards.find((b) => b.id === route.id);
        if (board) return <BoardDetail board={board} user={user} onBack={back} />;
        break;
      }
      case 'event': {
        const event = allEvents.find((e) => e.id === route.id);
        if (!event) break;
        return route.registered
          ? <RegistrationPreview event={event} attendee={user.name} onBack={() => replaceTop({ k: 'event', id: event.id })} onReturn={back} />
          : <EventDetails event={event} onBack={back} registered={mem.events.includes(event.id)} onUnregister={() => unregisterEvent(user.email, event.id)} onRegister={() => { registerEvent(user.email, event.id); replaceTop({ k: 'event', id: event.id, registered: true }); }} />;
      }
      case 'place': {
        const place = allPlaces.find((p) => p.id === route.id);
        if (!place) break;
        return route.directions
          ? <PlaceDirections place={place} university={user.university} onBack={() => replaceTop({ k: 'place', id: place.id })} />
          : (
            <PlaceDetails
              place={place}
              saved={mem.places.includes(place.id)}
              onToggleSave={() => toggleSavedPlace(user.email, place.id)}
              onBack={back}
              viewerEmail={user.email}
              onDirections={place.id === '1' ? () => replaceTop({ k: 'place', id: place.id, directions: true }) : undefined}
            />
          );
      }
    }
  }
  // The Home "+" opens the shared composer directly: no menu in between. It opens on the destination that matches Home.
  if (composing) {
    return <CreatePost user={user} initial={defaultDestination({ tab: 'home' })} onClose={(r) => { setComposing(false); if (r) toast.show(`Posted to ${r.label}.`); }} />;
  }
  return (
    <View style={s.screen}>
      {/* Header (Option B): profile top-left, "Vicinia" wordmark, quick add + notifications top-right. All targets are 44pt. */}
      <View style={s.homeHeader}>
        <TouchableOpacity onPress={goProfile} style={s.homeAvatarBtn} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Open your profile">
          <Avatar user={user} size={40} />
        </TouchableOpacity>
        <View style={s.homeTitleWrap}>
          <Text style={s.homeTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} accessibilityRole="header">Vicinia</Text>
        </View>
        <View ref={(n) => setTarget('quickadd', n)} collapsable={false} style={{ marginRight: 8 }}>
          <TouchableOpacity
            style={s.plusBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create a post"
            onPress={() => { Keyboard.dismiss(); setQuery(''); setComposing(true); }}
          ><Text style={{ fontWeight: '900', fontSize: 24, color: C.dark, marginTop: -2 }}>+</Text></TouchableOpacity>
        </View>
        <TouchableOpacity
          style={s.bellBtn}
          activeOpacity={0.8}
          onPress={() => push({ k: 'notifications' })}
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <LineIcon name="bell" size={20} />
          {unread > 0 && <View style={[s.redDot, { top: 10, right: 11 }]} />}
        </TouchableOpacity>
      </View>
      <KeyboardScroll style={s.fill} showsVerticalScrollIndicator={false}>
        <SearchBar filter value={query} onChangeText={setQuery} />

        {q ? (
          <View style={{ marginTop: 4 }}>
            {results.map((r) => (
              <TouchableOpacity key={r.key} activeOpacity={0.8} onPress={() => { Keyboard.dismiss(); r.go(); }} style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>{r.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.postName}>{r.title}</Text>
                  <Text style={s.muted}>{r.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {results.length === 0 && <EmptyState icon="🔍" title={`No results for “${query.trim()}”`} body="Check the spelling or try a place, event, board or office name." actionLabel="Clear search" onAction={() => setQuery('')} />}
          </View>
        ) : (
        <View style={s.quickRow}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q.label}
              style={[s.quickTile, { backgroundColor: q.bg, borderColor: q.border }]}
              onPress={QUICK_ROUTE[q.label] ? () => push(QUICK_ROUTE[q.label]) : undefined}
            >
              <OfficeIcon name={QUICK_ICON[q.label]} size={26} strokeWidth={1.7} />
              <Text style={s.quickLabel} numberOfLines={1} adjustsFontSizeToFit>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        )}

        {!q && (
          <>
            <View style={s.rowBetween}>
              <View>
                <Text style={s.sectionTitle}>For you</Text>
                <Text style={s.sectionSub}>Community picks</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAll((v) => !v)}><Text style={s.seeAll}>{showAll ? 'Show less' : 'See all'}</Text></TouchableOpacity>
            </View>


            {(showAll ? feed : feed.slice(0, 3 + myPosts.length)).map((p) => <PostCard key={p.id} p={p} user={user} />)}
          </>
        )}

        {toast.node}
        <View style={{ height: 12 }} />
      </KeyboardScroll>
    </View>
  );
}
