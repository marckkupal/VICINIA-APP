import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import type { CampusEvent } from '../data';
import { s } from '../styles';
import type { User } from '../types';
import { C } from '../theme';
import { EventDetails, RegistrationPreview } from './EventDetails';
import { registerEvent, unregisterEvent, useMembership } from '../membership';
import { PostEvent } from './PostEvent';
import { eventDate, useEventList } from '../userEvents';
import { useToast } from '../components/Toast';
import { BackButton } from '../components/BackButton';
import { goToTab, useTabTarget } from '../navigation';
import { EmptyState } from '../components/EmptyState';
import { OfficeIcon } from '../components/OfficeIcon';
import { EventRow, FeaturedEventCard } from '../components/EventCard';
import { FeaturedEventsSection } from '../components/FeaturedEventsSection';
import { FEATURED_EVENT_IDS } from '../featuredEvents';
import { pickFeaturedEvents } from '../content';
import { useNow } from '../useNow';
import { EventSkeleton } from '../components/EventSkeleton';
import { eventLayout, TOUCH_MIN } from '../eventLayout';
import { friendlyEventsError } from '../eventsApi';
import { addDays, categoriesOf, FILTERS, mondayOf, pageMode, sameDay, selectEvents, startOfDay, type Filter } from '../eventsView';

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// host: show only events organized by one office (e.g. Guidance). onBack adds a back button.
export function EventsScreen({ user, embedded, host, title, onBack }: { user?: User | null; embedded?: boolean; host?: 'guidance' | 'osa'; title?: string; onBack?: () => void }) {
  const [view, setView] = useState<'list' | 'details' | 'registered'>('list');
  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [posting, setPosting] = useState(false);
  const mem = useMembership(user?.email);
  const feed = useEventList(); // events from the server (plus this device's older local ones), with loading / error state
  const allEvents = feed.events;
  const featuredEvents = useMemo(() => pickFeaturedEvents(FEATURED_EVENT_IDS), []); // exactly the ids in src/featuredEvents.ts
  const now = useNow(); // keeps Upcoming / Past labels current while the page is open
  const toast = useToast();
  const L = eventLayout(useWindowDimensions().width);
  // Large screens: keep one centered column instead of stretching rows edge to edge.
  const column = L.maxWidth ? { width: '100%' as const, maxWidth: L.maxWidth, alignSelf: 'center' as const } : undefined;
  const [filter, setFilter] = useState<Filter>('For you');
  const [category, setCategory] = useState<string | null>(null);
  const [sel, setSel] = useState<Date>(() => startOfDay(new Date())); // the day picked in the week strip; opens on today
  // A search result on Home can open one event directly.
  useTabTarget('events', (tg) => {
    const e = allEvents.find((x) => x.id === tg.id);
    if (tg.kind === 'event' && e) { setEvent(e); setView('details'); }
  }, !embedded && !host);
  const events = embedded ? allEvents.filter((e) => mem.events.includes(e.id)) : host ? allEvents.filter((e) => e.host === host) : allEvents;

  if (posting) return <PostEvent onBack={() => setPosting(false)} onPosted={(e) => { setPosting(false); toast.show(`“${e.title}” is now listed in Events`); }} />;

  if (event && view === 'details') {
    return (
      <EventDetails
        event={event} onBack={() => setView('list')}
        registered={mem.events.includes(event.id)}
        onUnregister={() => unregisterEvent(user?.email, event.id)}
        onRegister={() => { registerEvent(user?.email, event.id); setView('registered'); }}
      />
    );
  }
  if (event && view === 'registered') {
    return <RegistrationPreview event={event} attendee={user?.name ?? 'Student'} onBack={() => setView('details')} onReturn={() => setView('list')} />;
  }

  const plain = !!embedded || !!host; // Profile "My events" and office pages keep the simple list
  const today = startOfDay(new Date());
  const openEvent = (e: CampusEvent) => { setEvent(e); setView('details'); };
  const weekStart = mondayOf(sel);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hasEvent = (d: Date) => allEvents.some((e) => sameDay(eventDate(e), d));
  const { upcoming, featured, rest } = selectEvents(events, { filter, category, sel, today });
  const categories = categoriesOf(events);
  const mode = pageMode({ status: feed.status, scope: events, today, upcomingCount: upcoming.length, plain });
  const monthLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
  const clearFilters = () => { setFilter('For you'); setCategory(null); setSel(today); };

  const header = plain ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      {!!onBack && <View style={{ marginRight: 12 }}><BackButton onPress={onBack} /></View>}
      <Text style={[s.header, { flex: 1, marginBottom: 0 }]}>{title ?? 'Events'}</Text>
    </View>
  ) : (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={[s.header, { marginBottom: 2 }]}>{title ?? 'Campus events'}</Text>
          <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 14, color: C.muted }}>Your week, all in one place</Text>
        </View>
        <TouchableOpacity onPress={() => setPosting(true)} accessibilityRole="button" accessibilityLabel="Post an event" style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontWeight: '900', fontSize: 24, color: C.yellow, marginTop: -2 }} importantForAccessibility="no">+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearFilters} accessibilityRole="button" accessibilityLabel="Jump to today" style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
          <OfficeIcon name="calendar" size={22} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: C.muted }}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => setSel(addDays(sel, -7))} accessibilityRole="button" accessibilityLabel="Previous week" style={{ width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22, color: C.dark, marginTop: -3 }}>‹</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSel(addDays(sel, 7))} accessibilityRole="button" accessibilityLabel="Next week" style={{ width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22, color: C.dark, marginTop: -3 }}>›</Text></TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        {week.map((d, i) => {
          const on = sameDay(d, sel);
          return (
            <TouchableOpacity key={i} onPress={() => { setSel(d); setFilter('For you'); }} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={`${DAY_NAMES[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${hasEvent(d) ? ', has events' : ''}`}
              style={{ flex: 1, minHeight: 60, marginRight: i < 6 ? L.weekGap : 0, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: on ? C.dark : C.border, backgroundColor: on ? C.dark : C.card }}>
              <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 10, fontWeight: '800', color: on ? C.yellow : C.muted }}>{DOW[d.getDay()]}</Text>
              <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 18, fontWeight: '900', color: on ? C.card : C.dark, marginTop: 2 }}>{String(d.getDate()).padStart(2, '0')}</Text>
              <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 4, backgroundColor: hasEvent(d) ? (on ? C.yellow : C.orange) : 'transparent' }} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: categories.length > 1 ? 0 : 6 }}>
        {FILTERS.map((f) => {
          const on = f === filter;
          return (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`Filter: ${f}`}
              style={{ minHeight: TOUCH_MIN, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 22, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: on ? C.dark : C.border, backgroundColor: on ? C.dark : C.card }}>
              <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 14, fontWeight: '800', color: on ? C.card : C.dark }}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {categories.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6, flexGrow: 0 }} accessibilityLabel="Event categories">
          {[null, ...categories].map((c) => {
            const on = c === category;
            const label = c === null ? 'All categories' : c.charAt(0) + c.slice(1).toLowerCase();
            return (
              <TouchableOpacity key={c ?? 'all'} onPress={() => setCategory(c)} activeOpacity={0.8} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`Category: ${label}`}
                style={{ minHeight: TOUCH_MIN, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 22, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: on ? C.purple : C.border, backgroundColor: on ? C.purple : C.card }}>
                <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 14, fontWeight: '800', color: on ? C.card : C.dark }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </>
  );

  // The latest refresh failed but there is a saved copy to show.
  const staleBanner = feed.error && events.length > 0 ? (
    <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.errorBg, borderRadius: 16, paddingLeft: 14, marginBottom: 14, minHeight: TOUCH_MIN }}>
      <Text style={{ flex: 1, fontSize: 13, color: C.dark, paddingVertical: 8 }}>{friendlyEventsError(feed.error)} Showing the last saved events.</Text>
      <TouchableOpacity onPress={feed.refresh} accessibilityRole="button" accessibilityLabel="Retry loading events" style={{ minHeight: TOUCH_MIN, paddingHorizontal: 16, justifyContent: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: C.error }}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  const list = plain ? events : rest;
  const stateBlock = mode === 'loading' ? <EventSkeleton featured={!plain} />
    : mode === 'error' ? <EmptyState icon="📡" title="Couldn’t load events" body={friendlyEventsError(feed.error)} actionLabel="Try again" onAction={feed.refresh} />
    : mode === 'empty' ? (embedded
      ? <EmptyState icon="🎟️" title="No registered events yet" body="Register for an event and it will show up here." actionLabel="Browse events" onAction={() => goToTab('events')} />
      : host ? <Text style={[s.muted, { textAlign: 'center', marginTop: 24 }]}>No upcoming events from the office yet.</Text>
      : <EmptyState icon="📅" title="No upcoming events yet" body="Nothing is scheduled right now. Check back soon, or post one yourself." actionLabel="Post an event" onAction={() => setPosting(true)} />)
    : mode === 'noMatch' ? <EmptyState icon="🔎" title="No events for this view" body="Try another day, filter or category." actionLabel="Clear filters" onAction={clearFilters} />
    : null;

  const body = (
    <>
      {staleBanner}
      {!plain && <FeaturedEventsSection events={featuredEvents} now={now} onOpen={openEvent} />}
      {stateBlock}
      {mode === 'list' && (
        <>
          {!plain && featuredEvents.length === 0 && !!featured && <FeaturedEventCard e={featured} label={featured.featured || sameDay(eventDate(featured), sel) ? 'FEATURED' : 'UP NEXT'} onPress={() => openEvent(featured)} />}
          {!plain && list.length > 0 && <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '900', color: C.dark, marginBottom: 12 }}>Coming up</Text>}
          {list.map((e) => <EventRow key={e.id} e={e} registered={mem.events.includes(e.id)} onPress={() => openEvent(e)} />)}
        </>
      )}
      {toast.node}
      <View style={{ height: 24 }} />
    </>
  );
  const refresh = <RefreshControl refreshing={feed.refreshing && feed.status === 'ready'} onRefresh={feed.refresh} tintColor={C.dark} />;
  // Embedded inside another scrolling page (e.g. LibPage) keep one scroll view; otherwise pin the header.
  if (embedded) {
    return (
      <ScrollView style={s.screen} showsVerticalScrollIndicator={false} refreshControl={refresh}>
        <View style={column}>{header}{body}</View>
      </ScrollView>
    );
  }
  // The main Events page is tall (week strip, filters, featured card), so everything scrolls together.
  if (!plain) {
    return (
      <View style={s.screen}>
        <ScrollView style={s.fill} showsVerticalScrollIndicator={false} refreshControl={refresh}>
          <View style={column}>{header}{body}</View>
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={s.screen}>
      <View style={[{ flex: 1 }, column]}>
        {header}
        <ScrollView style={s.fill} showsVerticalScrollIndicator={false} refreshControl={refresh}>
          {body}
        </ScrollView>
      </View>
    </View>
  );
}
