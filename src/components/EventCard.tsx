import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { CampusEvent } from '../data';
import { C } from '../theme';
import { eventLayout } from '../eventLayout';

const sentence = (v: string) => { const l = v.toLowerCase(); return l.charAt(0).toUpperCase() + l.slice(1); };
export const kindLabel = (e: CampusEvent) => sentence(e.kind);
// "Workshop · ₱150", "Technology · Free"
// The fee part is left out when the organizer did not list one (never shown as "Free" by default).
export const feeLabel = (e: CampusEvent) => (e.fee === null || e.fee === undefined ? '' : e.fee === 0 ? 'Free' : `₱${e.fee}`);
export const tagLine = (e: CampusEvent) => [kindLabel(e), feeLabel(e), e.local ? 'On this device' : ''].filter(Boolean).join(' · ');
export const shortDate = (e: CampusEvent) => `${sentence(e.mon)} ${Number(e.day)}`;
// Spoken summary used as the accessibility label of a card.
const spoken = (e: CampusEvent, extra?: string) => [extra, e.title, `${shortDate(e)}, ${e.time}`, e.venue, feeLabel(e)].filter(Boolean).join('. ');

// Big dark card at the top of the Events page.
export function FeaturedEventCard({ e, label, onPress }: { e: CampusEvent; label: string; onPress: () => void }) {
  const L = eventLayout(useWindowDimensions().width);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} accessibilityRole="button" accessibilityLabel={spoken(e, label)}
      style={{ backgroundColor: C.dark, borderRadius: 22, padding: 18, minHeight: L.featuredMinHeight, justifyContent: 'space-between', marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ backgroundColor: C.yellow, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 12, fontWeight: '900', color: C.dark, letterSpacing: 0.4 }}>{label}</Text>
        </View>
        <Text style={{ fontSize: 30 }}>{e.icon}</Text>
      </View>
      <View style={{ marginTop: 28 }}>
        <Text maxFontSizeMultiplier={1.3} style={{ fontSize: L.featuredTitle, fontWeight: '900', color: C.card }} numberOfLines={2}>{e.title}</Text>
        <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 14, color: C.onDarkMuted, marginTop: 4 }} numberOfLines={2}>{shortDate(e)} · {e.time} · {e.venue}</Text>
      </View>
    </TouchableOpacity>
  );
}

// One row of "Coming up".
export function EventRow({ e, registered, onPress }: { e: CampusEvent; registered?: boolean; onPress: () => void }) {
  const L = eventLayout(useWindowDimensions().width);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} accessibilityRole="button" accessibilityLabel={spoken(e, registered ? 'Registered' : undefined)}
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: 88, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 14, marginBottom: 12 }}>
      {/* Date badge: fixed size so every row lines up, even with larger system text. */}
      <View style={{ width: L.tile, height: L.tile, borderRadius: 16, backgroundColor: e.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>{e.icon}</Text>
        <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 12, fontWeight: '900', color: C.dark, marginTop: 2 }}>{e.mon} {e.day}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text maxFontSizeMultiplier={1.3} style={{ flex: 1, fontSize: 16, fontWeight: '800', color: C.dark }} numberOfLines={1}>{e.title}</Text>
          {registered && (
            <View style={{ backgroundColor: C.successBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
              <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 10, fontWeight: '900', color: C.green, letterSpacing: 0.4 }}>REGISTERED</Text>
            </View>
          )}
        </View>
        <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13, color: C.muted, marginTop: 3 }} numberOfLines={1}>{e.venue} · {e.time}</Text>
        <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 13, fontWeight: '800', color: C.purple, marginTop: 4 }} numberOfLines={1}>{tagLine(e)}</Text>
      </View>
    </TouchableOpacity>
  );
}
