import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LibPage } from '../components/LibPage';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import { Select } from '../components/Select';
import { s } from '../styles';
import { C } from '../theme';

export interface Booking { room: string; date: string; startMin: number; durationMin: number }

const ROOMS = ['Group study room A · Demo', 'Group study room B · Demo', 'Group study room C · Demo'];
const DURATIONS = [{ min: 30, label: '30 min' }, { min: 60, label: '1 hour' }, { min: 120, label: '2 hours' }];
const OPEN_MIN = 7 * 60;   // 7:00 AM
const CLOSE_MIN = 20 * 60; // 8:00 PM
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number) => (n < 10 ? '0' + n : String(n));
const parts = (m: number) => {
  const h = Math.floor(m / 60);
  return { h12: h % 12 || 12, mm: pad(m % 60), suffix: h >= 12 ? 'PM' : 'AM' };
};
export const fmtTime = (m: number) => { const p = parts(m); return `${p.h12}:${p.mm} ${p.suffix}`; };
export const fmtRange = (start: number, end: number) => {
  const a = parts(start), b = parts(end);
  return a.suffix === b.suffix ? `${a.h12}:${a.mm}–${b.h12}:${b.mm} ${b.suffix}` : `${fmtTime(start)}–${fmtTime(end)}`;
};
export const durationLabel = (min: number) => (min === 30 ? '30 minutes' : min === 60 ? '1 hour' : '2 hours');

// Next five library days (Mon–Fri), starting tomorrow.
const libraryDays = () => {
  const out: string[] = [];
  const d = new Date();
  while (out.length < 5) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(`${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
  }
  return out;
};

export function LibraryBooking({ onBack, onConfirm }: { onBack: () => void; onConfirm: (b: Booking) => void }) {
  const [days] = useState(libraryDays);
  const [room, setRoom] = useState(ROOMS[0]);
  const [date, setDate] = useState(days[0]);
  const [startMin, setStartMin] = useState(14 * 60);
  const [durationMin, setDurationMin] = useState(60);

  // Start times that still finish by closing time for the chosen duration.
  const starts: number[] = [];
  for (let m = OPEN_MIN; m + durationMin <= CLOSE_MIN; m += 30) starts.push(m);
  useEffect(() => {
    if (!starts.includes(startMin)) setStartMin(starts[starts.length - 1]);
  }, [durationMin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LibPage
      title="Book a study room"
      sub="Main Library · Demo booking"
      onBack={onBack}
      footer={<PrimaryButton label={'🗓️  Confirm demo booking'} onPress={() => onConfirm({ room, date, startMin, durationMin })} />}
    >
      <View style={s.lbPlanCard}>
        <Text style={s.lbPlanTitle}>Plan a little focus time.</Text>
        <Text style={s.lbBody}>Reserve a group room for up to 2 hours. Sample rooms and times are shown below.</Text>
      </View>

      <Text style={s.lbFieldLabel}>Room</Text>
      <Select icon="📖" value={room} options={ROOMS} onChange={setRoom} />

      <Text style={s.lbFieldLabel}>Date</Text>
      <Select icon="🗓️" value={date} options={days} onChange={setDate} />

      <Text style={s.lbFieldLabel}>Start time</Text>
      <Select icon="🕒" value={fmtTime(startMin)} options={starts.map(fmtTime)} onChange={(v) => setStartMin(starts.find((m) => fmtTime(m) === v) ?? startMin)} />

      <Text style={s.lbFieldLabel}>Duration</Text>
      <View style={s.lbChipRow}>
        {DURATIONS.map((d) => {
          const on = durationMin === d.min;
          return (
            <TouchableOpacity key={d.min} style={[s.lbChip, on && s.lbChipOn]} onPress={() => setDurationMin(d.min)}>
              <Text style={[s.lbChipText, on && s.lbChipTextOn]}>{d.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[s.lbHint, { marginTop: 0 }]}>
        Ends at {fmtTime(startMin + durationMin)}. Select 30 minutes to 2 hours within library hours: Mon–Fri · 7:00 AM–8:00 PM.
      </Text>

      <PrivacyNote text="Demo only. No room is held or booked. Select a room, date and start time; duration cannot exceed 2 hours." />
    </LibPage>
  );
}

export function BookingSummary({ booking: b, student, onBack, onDone }: { booking: Booking; student: string; onBack: () => void; onDone: () => void }) {
  const rows: [string, string][] = [
    ['ROOM', b.room],
    ['WHEN', `${b.date} · ${fmtRange(b.startMin, b.startMin + b.durationMin)}`],
    ['DURATION', durationLabel(b.durationMin)],
    ['STUDENT', student],
  ];
  return (
    <LibPage title="Booking summary" sub="Main Library" onBack={onBack} footer={<PrimaryButton label="Return to Library" onPress={onDone} />}>
      <View style={s.lbSuccessWrap}>
        <View style={s.lbSuccessCircle}><Text style={{ fontSize: 34, color: C.green }}>✓</Text></View>
        <Text style={s.lbSuccessTitle}>Your demo booking is ready.</Text>
      </View>
      <Text style={s.lbSuccessSub}>Here’s what your study room reservation would look like.</Text>
      <View style={s.lbSummaryCard}>
        {rows.map(([label, value], i) => (
          <View key={label}>
            <Text style={s.lbLabel}>{label}</Text>
            <Text style={[s.lbValue, i === rows.length - 1 && { marginBottom: 0 }]}>{value}</Text>
          </View>
        ))}
      </View>
      <PrivacyNote text="Simulated booking only. No room has been reserved. Contact the library desk for an actual booking." />
    </LibPage>
  );
}
