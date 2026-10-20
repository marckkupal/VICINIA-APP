import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useToast } from '../components/Toast';
import { useActionSheet } from '../components/ActionSheet';
import { Avatar } from '../components/Avatar';
import { AppLogo } from '../components/AppLogo';
import { LineIcon } from '../components/LineIcon';
import type { LineIconName } from '../components/LineIcon';
import { PostCard } from '../components/PostCard';
import { SearchBar } from '../components/SearchBar';
import { BOARDS, EVENTS, PLACES, POSTS, QUICK } from '../data';
import { useNotifications } from '../notifications';
import type { NotifTarget } from '../notifications';
import { personOf } from '../people';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
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

const QUICK_ICON: Record<string, LineIconName> = { Guidance: 'care', Library: 'book', Clinic: 'cross', OSA: 'cap' };

// Pages opened from Home. Back always returns to the page that opened it (e.g. Notifications).
type Route =
  | { k: 'library' } | { k: 'clinic' } | { k: 'osa' } | { k: 'guidance' } | { k: 'notifications' } | { k: 'notifPrefs' }
  | { k: 'member'; id: string } | { k: 'chat'; id: string } | { k: 'board'; id: string }
  | { k: 'event'; id: string; registered?: boolean } | { k: 'place'; id: string; directions?: boolean };

const QUICK_ROUTE: Record<string, Route> = {
  Library: { k: 'library' }, Clinic: { k: 'clinic' }, OSA: { k: 'osa' }, Guidance: { k: 'guidance' },
};

export function HomeScreen({ user, goProfile }: { user: User; goProfile: () => void }) {
  const [stack, setStack] = useState<Route[]>([]);
  const [showAll, setShowAll] = useState(false);
  const toast = useToast();
  const sheet = useActionSheet();
  const [savedPlaces, setSavedPlaces] = useState<Record<string, boolean>>({});
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

  if (route) {
    switch (route.k) {
      case 'library': return <LibraryScreen user={user} onBack={back} />;
      case 'clinic': return <ClinicScreen onBack={back} />;
      case 'osa': return <OSAScreen user={user} onBack={back} onOpenEvent={(id) => push({ k: 'event', id })} />;
      case 'guidance': return <GuidanceScreen user={user} onBack={back} onOpenEvent={(id) => push({ k: 'event', id })} />;
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
          : <EventDetails event={event} onBack={back} onRegister={() => replaceTop({ k: 'event', id: event.id, registered: true })} />;
      }
      case 'place': {
        const place = PLACES.find((p) => p.id === route.id);
        if (!place) break;
        return route.directions
          ? <PlaceDirections place={place} university={user.university} onBack={() => replaceTop({ k: 'place', id: place.id })} />
          : (
            <PlaceDetails
              place={place}
              saved={!!savedPlaces[place.id]}
              onToggleSave={() => setSavedPlaces((m) => ({ ...m, [place.id]: !m[place.id] }))}
              onBack={back}
              onDirections={place.id === '1' ? () => replaceTop({ k: 'place', id: place.id, directions: true }) : undefined}
            />
          );
      }
    }
  }
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
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
            { text: 'Library', onPress: () => push(QUICK_ROUTE.Library) },
            { text: 'Notifications', onPress: () => push({ k: 'notifications' }) },
          ])}
        ><Text style={{ fontWeight: '900', fontSize: 24, color: C.dark, marginTop: -2 }}>+</Text></TouchableOpacity>
      </View>

      <SearchBar filter />

      <View style={s.quickRow}>
        {QUICK.map((q) => (
          <TouchableOpacity
            key={q.label}
            style={[s.quickTile, { backgroundColor: q.bg, borderColor: q.border }]}
            onPress={QUICK_ROUTE[q.label] ? () => push(QUICK_ROUTE[q.label]) : undefined}
          >
            <LineIcon name={QUICK_ICON[q.label]} size={26} />
            <Text style={s.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.rowBetween}>
        <View>
          <Text style={s.sectionTitle}>For you</Text>
          <Text style={s.sectionSub}>Community picks</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAll((v) => !v)}><Text style={s.seeAll}>{showAll ? 'Show less' : 'See all'}</Text></TouchableOpacity>
      </View>

      {(showAll ? POSTS : POSTS.slice(0, 3)).map((p) => <PostCard key={p.id} p={p} />)}
      {toast.node}
      {sheet.node}
      <View style={{ height: 12 }} />
    </ScrollView>
  );
}
