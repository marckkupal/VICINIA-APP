import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LibPage } from '../components/LibPage';
import { Field } from '../components/Field';
import { Select } from '../components/Select';
import { PrimaryButton } from '../components/PrimaryButton';
import { EVENT_CATEGORIES, MONTH_NAMES } from '../userEvents';
import { createEvent, friendlyEventsError } from '../eventsApi';
import { eventsFeed } from '../eventsStore';
import type { CampusEvent } from '../data';
import { s } from '../styles';
import { C } from '../theme';

const TIME_RE = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM)$/i;

// Students and organizers post a campus event: it is listed on the Events page like the others.
export function PostEvent({ onBack, onPosted }: { onBack: () => void; onPosted: (e: CampusEvent) => void }) {
  const now = new Date();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EVENT_CATEGORIES[0].label);
  const [month, setMonth] = useState(MONTH_NAMES[now.getMonth()]);
  const [day, setDay] = useState(String(now.getDate()));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [fee, setFee] = useState('');
  const [about, setAbout] = useState('');
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false); // set synchronously, so a fast double tap can't send two events before `saving` re-renders
  const [failure, setFailure] = useState<string | null>(null);

  const m = MONTH_NAMES.indexOf(month);
  const d = Number(day);
  const y = Number(year);
  const exists = new Date(y, m, d).getMonth() === m;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const past = new Date(y, m, d).getTime() < today;
  const timeMatch = time.trim().match(TIME_RE);

  const titleErr = tried && !title.trim() ? 'Enter the event name.' : undefined;
  const dateErr = tried && !exists ? 'That date does not exist. Check the month and day.' : tried && past ? 'Pick today or a later date.' : undefined;
  const timeErr = tried && !timeMatch ? 'Enter a time like 2:00 PM.' : undefined;
  const venueErr = tried && !venue.trim() ? 'Enter where the event is held.' : undefined;

  // Saves to the server first; the event is only announced as listed once the server confirmed it.
  const submit = async () => {
    if (lock.current || saving) return; // ignore taps while a save is running
    setTried(true);
    if (!title.trim() || !exists || past || !timeMatch || !venue.trim()) return;
    let hour = Number(timeMatch[1]) % 12;
    if (timeMatch[3].toUpperCase() === 'PM') hour += 12;
    const startsAt = new Date(y, m, d, hour, Number(timeMatch[2]));
    lock.current = true;
    setSaving(true);
    setFailure(null);
    try {
      const ev = await createEvent({ title, category, startsAt, venue, fee: Number(fee) || 0, about });
      eventsFeed.upsert(ev);
      onPosted(ev);
    } catch (e) {
      setFailure(friendlyEventsError(e));
      lock.current = false;
      setSaving(false);
    }
  };

  const years = [String(now.getFullYear()), String(now.getFullYear() + 1)];

  return (
    <LibPage
      title="Post an event"
      sub="Share a campus event with students"
      onBack={onBack}
      footer={
        <>
          {!!failure && <Text accessibilityRole="alert" style={{ color: C.error, fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{failure}</Text>}
          <PrimaryButton label="Post event" onPress={submit} busy={saving} />
        </>
      }
    >
      <View style={[s.infoCard, { marginTop: 4 }]}>
        <Text style={s.infoCardText}>Only post real campus events. Events are written by organizers and aren’t verified by Vicinia. You need to be logged in to post.</Text>
      </View>

      <Field label="Event name" value={title} onChangeText={setTitle} placeholder="e.g. Photo Walk at Cubao" autoCapitalize="words" maxLength={60} errorText={titleErr} />

      <Text style={s.fieldLabel}>Category</Text>
      <View style={{ marginBottom: 14 }}>
        <Select icon={EVENT_CATEGORIES.find((c) => c.label === category)?.icon ?? '🎟️'} value={category} options={EVENT_CATEGORIES.map((c) => c.label)} onChange={setCategory} />
      </View>

      <Text style={s.fieldLabel}>Date</Text>
      <View style={{ marginBottom: 6 }}>
        <Select icon="🗓️" value={month} options={MONTH_NAMES} onChange={setMonth} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        <View style={{ flex: 1, marginRight: 8 }}><Select icon="📆" value={day} options={Array.from({ length: 31 }, (_, i) => String(i + 1))} onChange={setDay} /></View>
        <View style={{ flex: 1 }}><Select icon="📅" value={year} options={years} onChange={setYear} /></View>
      </View>
      {!!dateErr && <Text style={{ color: C.error, fontSize: 12, marginBottom: 8 }}>{dateErr}</Text>}
      <View style={{ height: 8 }} />

      <Field label="Time" icon="🕑" value={time} onChangeText={setTime} placeholder="e.g. 2:00 PM" autoCapitalize="characters" maxLength={8} errorText={timeErr} />
      <Field label="Venue" icon="📍" value={venue} onChangeText={setVenue} placeholder="e.g. TIP QC Room 201" autoCapitalize="words" maxLength={60} errorText={venueErr} />
      <Field label="Fee in ₱ (optional)" value={fee} onChangeText={(t) => setFee(t.replace(/[^0-9]/g, ''))} placeholder="Leave empty if free" keyboardType="number-pad" maxLength={5} helper="Vicinia doesn’t collect any payment." />
      <Field label="About (optional)" value={about} onChangeText={setAbout} placeholder="What will happen? Who is it for?" autoCapitalize="sentences" multiline maxLength={300} />
    </LibPage>
  );
}
