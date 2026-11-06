import { Text, View } from 'react-native';
import type { CampusEvent } from '../data';
import { statusOf } from '../content/filters';
import { STATUS_LABEL, type EventStatus } from '../eventStatus';
import { C } from '../theme';

const LOOK: Record<EventStatus, { bg: string; fg: string }> = {
  upcoming: { bg: C.successBg, fg: '#1F6B3B' },
  past: { bg: '#ECEAE2', fg: C.muted },
  tba: { bg: '#FDF1C4', fg: C.dark },
};

export { statusOf };

// Past / Upcoming / Date TBA, worked out from the event's date and the clock passed in.
export function StatusBadge({ event, now }: { event: CampusEvent; now: number }) {
  const st = statusOf(event, now);
  const look = LOOK[st];
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: look.bg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: look.fg }}>{STATUS_LABEL[st]}</Text>
    </View>
  );
}

// "November 5, 2026 · 1:00 PM", or "Date TBA" when no date has been announced.
export const whenText = (e: CampusEvent, long = false) =>
  e.dateTba ? 'Date TBA' : `${long ? e.dateLong : e.dateShort}${e.time ? ` · ${e.time}` : ''}`;

// Shown whenever a person has not confirmed the event's details (verified_by_human is not true).
export function UnconfirmedLabel({ event }: { event: CampusEvent }) {
  if (event.verifiedByHuman === true) return null;
  return (
    <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderStyle: 'dashed', borderColor: C.orange, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: C.orange }}>Details unconfirmed</Text>
    </View>
  );
}
