import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useToast } from '../components/Toast';
import { useActionSheet } from '../components/ActionSheet';
import { Avatar } from '../components/Avatar';
import { AppLogo } from '../components/AppLogo';
import { LineIcon } from '../components/LineIcon';
import { OfficeIcon } from '../components/OfficeIcon';
import type { OfficeIconName } from '../components/OfficeIcon';
import { SearchBar } from '../components/SearchBar';
import { PostCard } from '../components/PostCard';
import { PostComposerModal, makePost, POST_TINTS } from '../components/PostSection';
import { BOARDS, EVENTS, PLACES, POSTS, QUICK } from '../data';
import { setNotifUser, useNotifications } from '../notifications';
import type { NotifTarget } from '../notifications';
import { goToTab } from '../navigation';
import { personOf } from '../people';
import { registerEvent, setActiveUser, toggleSavedPlace, useMembership } from '../membership';
import { s } from '../styles';
import { C } from '../theme';
import type { Post, User } from '../types';
import { ChatScreen } from './ChatScreen';
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

const POST_TAGS = ['General', 'Study', 'Events', 'Food'];

const QUICK_ROUTE: Record<string, Route> = {
  Library: { k: 'library' }, Clinic: { k: 'clinic' }, OSA: { k: 'osa' }, Guidance: { k: 'guidance' },
};

export function HomeScreen({ user, goProfile }: { user: User; goProfile: () => void }) {
  const [stack, setStack] = useState<Route[]>([]);
  const toast = useToast();
  const sheet = useActionSheet();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [composing, setComposing] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  setActiveUser(user.email);
  setNotifUser(user.email);
  const mem = useMembership(user.email);
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

  const publish = (text: string, i: number, media: string[]) => {
    setMyPosts((m) => [makePost(`me-${Date.now()}`, user, text, POST_TAGS[i], POST_TINTS[i % POST_TINTS.length], media), ...m]);
    toast.show('Posted to your feed.');
  };
  const feed = [...myPosts, ...POSTS];
  const q = query.trim().toLowerCase();
  const has = (...f: (string | undefined)[]) => f.some((x) => x?.toLowerCase().includes(q));
  const results: { key: string; icon: string; title: string; sub: string; go: () => void }[] = q ? [
    ...QUICK.filter((o) => has(o.label)).map((o) => ({ key: `o-${o.label}`, icon: o.icon, title: o.label, sub: 'Campus office', go: () => QUICK_ROUTE[o.label] && push(QUICK_ROUTE[o.label]) })),
    ...PLACES.filter((p) => has(p.name, p.type, p.kind)).map((p) => ({ key: `p-${p.id}`, icon: p.emoji, title: p.name, sub: `Place · ${p.type}`, go: () => push({ k: 'place', id: p.id }) })),
    ...EVENTS.filter((e) => has(e.title, e.venue, e.kind)).map((e) => ({ key: `e-${e.id}`, icon: e.icon, title: e.title, sub: `Event · ${e.dateShort}`, go: () => push({ k: 'event', id: e.id }) })),
    ...BOARDS.filter((b) => has(b.name)).map((b) => ({ key: `b-${b.id}`, icon: b.emoji, title: b.name, sub: `Community · ${b.members} members`, go: () => push({ k: 'board', id: b.id }) })),
  ] : [];

  if (route) {
    switch (route.k) {
      case 'library': return <LibraryScreen user={user} onBack={back} />;
      case 'clinic': return <ClinicScreen onBack={back} />;
      case 'osa': return <OSAScreen user={user} onBack={back} onOpenEvent={(id) => push({ k: 'event', id })} />;
      case 'guidance': return <GuidanceScreen user={user} onBack={back} onOpenEvents={() => goToTab('events')} />;
      case 'notifications': return <NotificationsPage onBack={back} onOpen={openTarget} onSettings={() => push({ k: 'notifPrefs' })} />;
      case 'notifPrefs': return <NotificationsScreen onBack={back} />;
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
        const board = BOARDS.find((b) => b.id === route.id);
        if (board) return <BoardDetail board={board} user={user} onBack={back} />;
        break;
      }
      case 'event': {
        const event = EVENTS.find((e) => e.id === route.id);
        if (!event) break;
        return route.registered
          ? <RegistrationPreview event={event} attendee={user.name} onBack={() => replaceTop({ k: 'event', id: event.id })} onReturn={back} />
          : <EventDetails event={event} onBack={back} onRegister={() => { registerEvent(user.email, event.id); replaceTop({ k: 'event', id: event.id, registered: true }); }} />;
      }
      case 'place': {
        const place = PLACES.find((p) => p.id === route.id);
        if (!place) break;
        return route.directions
          ? <PlaceDirections place={place} university={user.university} onBack={() => replaceTop({ k: 'place', id: place.id })} />
          : (
            <PlaceDetails
              place={place}
              saved={mem.places.includes(place.id)}
              onToggleSave={() => toggleSavedPlace(user.email, place.id)}
              onBack={back}
              onDirections={place.id === '1' ? () => replaceTop({ k: 'place', id: place.id, directions: true }) : undefined}
            />
          );
      }
    }
  }
  return (
    <View style={s.screen}>
      <View style={s.homeHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <AppLogo size={56} />
          <Text style={[s.homeTitle, { marginLeft: 14 }]}>VICINIA</Text>
        </View>
        <TouchableOpacity
          style={s.bellBtn}
          activeOpacity={0.8}
          onPress={() => push({ k: 'notifications' })}
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <LineIcon name="bell" size={24} />
          {unread > 0 && <View style={[s.redDot, { top: 14, right: 14 }]} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={goProfile} style={{ marginHorizontal: 12 }}><Avatar user={user} size={54} /></TouchableOpacity>
        <TouchableOpacity
          style={s.plusBtn}
          accessibilityLabel="Quick add"
          onPress={() => sheet.open('Quick add', [
            { text: 'New post', onPress: () => { setQuery(''); setComposing(true); } },
            { text: 'Library', onPress: () => push(QUICK_ROUTE.Library) },
            { text: 'Notifications', onPress: () => push({ k: 'notifications' }) },
          ])}
        ><Text style={{ fontWeight: '900', fontSize: 24, color: C.dark, marginTop: -2 }}>+</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.fill} showsVerticalScrollIndicator={false}>
        <SearchBar filter value={query} onChangeText={setQuery} />

        {q ? (
          <View style={{ marginTop: 4 }}>
            {results.map((r) => (
              <TouchableOpacity key={r.key} activeOpacity={0.8} onPress={r.go} style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>{r.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.postName}>{r.title}</Text>
                  <Text style={s.muted}>{r.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {results.length === 0 && <Text style={[s.muted, { textAlign: 'center', marginTop: 24 }]}>No results for “{query.trim()}”.</Text>}
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


            {(showAll ? feed : feed.slice(0, 3 + myPosts.length)).map((p) => <PostCard key={p.id} p={p} />)}
          </>
        )}

        <PostComposerModal visible={composing} onClose={() => setComposing(false)} onSubmit={publish} tags={POST_TAGS} placeholder="Share something with the community…" />
        {toast.node}
        {sheet.node}
        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}
