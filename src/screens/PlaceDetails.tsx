import { Text, TouchableOpacity, View } from 'react-native';
import { LibPage } from '../components/LibPage';
import { usePopup } from '../components/Popup';
import { REPORT_REASONS, reportItem, useHasReported } from '../reports';
import type { Place } from '../data';
import { s } from '../styles';
import { C } from '../theme';
import { campusLabel } from '../utils';

const note = { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7E0', borderRadius: 12, padding: 12, marginBottom: 12 } as const;

function Note({ text }: { text: string }) {
  return (
    <View style={note}>
      <Text style={{ color: C.green, marginRight: 8 }}>🛡️</Text>
      <Text style={s.privacyText}>{text}</Text>
    </View>
  );
}

const ABOUT: Record<string, string> = {
  food: 'A food stop around campus, shown in your nearby places. Check the venue directly for current seating and menu availability.',
  study: 'A study spot around campus, shown in your nearby places. Check the venue directly for current seating and hours.',
  orgs: 'A campus community space, shown in your nearby places. Check with the organization for meeting schedules.',
};

export function PlaceDetails({ place, saved, onToggleSave, onBack, onDirections, backLabel = 'Back to Explore', viewerEmail }: {
  place: Place; saved: boolean; onToggleSave: () => void; onBack: () => void; onDirections?: () => void; backLabel?: string;
  viewerEmail?: string | null;   // reports are kept per account
}) {
  const popup = usePopup();
  const reported = useHasReported(place.id, viewerEmail);

  const sendReport = (reason: string) => {
    reportItem(place.id, reason, viewerEmail);
    popup.show({
      icon: '✅', iconBg: C.successBg,
      title: 'Thanks for letting us know',
      body: `Your report (“${reason}”) was sent (demo). Vicinia reviews reports about listings.`,
      actions: [{ text: 'Done' }],
    });
  };
  const chooseReason = () => popup.show({
    icon: '🚩', iconBg: C.errorBg,
    title: 'Report this place',
    body: 'What is wrong with this listing? Your report is anonymous.',
    actions: [
      ...REPORT_REASONS.map((r) => ({ text: r, style: 'secondary' as const, onPress: () => sendReport(r) })),
      { text: 'Cancel', style: 'secondary' as const },
    ],
  });
  const options = () => popup.show({
    icon: '⋯', iconBg: '#F3F1EA',
    title: 'Listing options',
    body: place.name,
    actions: [
      { text: reported ? 'Already reported' : 'Report listing', style: 'secondary' as const, onPress: reported ? undefined : chooseReason },
      { text: 'Close', style: 'secondary' as const },
    ],
  });
  return (
    <LibPage
      title="Place details"
      sub="Explore nearby"
      onBack={onBack}
      footer={
        <>
          {!!onDirections && (
            <TouchableOpacity style={[s.primaryBtn, { marginBottom: 10 }]} onPress={onDirections} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Get directions · Demo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.secondaryBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={s.secondaryBtnText}>{backLabel}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={{ height: 160, borderRadius: 20, backgroundColor: '#FDF1C4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 72 }}>{place.emoji}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark, flex: 1 }}>{place.name}</Text>
        <TouchableOpacity onPress={onToggleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={saved ? 'Remove bookmark' : 'Bookmark place'}>
          <Text style={{ fontSize: 22, opacity: saved ? 1 : 0.4 }}>🔖</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={options} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Listing options" style={{ marginLeft: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: C.muted }}>···</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        <View style={[s.lbChip, s.lbChipOn]}><Text style={[s.lbChipText, s.lbChipTextOn]}>{place.type}</Text></View>
        <View style={s.lbChip}><Text style={s.lbChipText}>{place.distance} away</Text></View>
      </View>

      <View style={[s.evFee, { marginTop: 0 }]}>
        {!!place.price && <Text style={s.evFeeTitle}>{place.price} per person</Text>}
        <Text style={{ fontSize: 13, fontWeight: '800', color: C.green, marginBottom: 8 }}>{place.status}</Text>
        <Text style={s.lbCardMeta}>Status from the existing Explore listing, not a live wait estimate.</Text>
      </View>

      <Text style={[s.lbH2, { marginTop: 4 }]}>Before you visit</Text>
      <Text style={{ fontSize: 14, color: C.dark, lineHeight: 21, marginBottom: 14 }}>{ABOUT[place.kind]}</Text>

      <Note text="Address and opening hours aren’t available in this prototype. No live booking, queue or directions are provided." />

      <TouchableOpacity onPress={reported ? undefined : chooseReason} activeOpacity={0.7} accessibilityRole="button" style={{ alignSelf: 'center', paddingVertical: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: reported ? C.muted : C.error }}>{reported ? '✓ You reported this listing' : '🚩 Report this listing'}</Text>
      </TouchableOpacity>
      {popup.node}
    </LibPage>
  );
}

/* ---------- Directions (illustrative map, no GPS) ---------- */
function Line({ style }: { style: object }) {
  return <View style={[{ position: 'absolute', backgroundColor: C.yellow }, style]} />;
}

export function PlaceDirections({ place, university, onBack }: { place: Place; university: string; onBack: () => void }) {
  return (
    <LibPage
      title="Directions"
      sub={place.name}
      onBack={onBack}
      footer={
        <TouchableOpacity style={s.secondaryBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={s.secondaryBtnText}>Return to {place.name.replace(' Cafe', '')}</Text>
        </TouchableOpacity>
      }
    >
      {/* Illustrative map */}
      <View style={{ height: 230, borderRadius: 20, backgroundColor: '#EDEAE0', overflow: 'hidden', marginBottom: 12 }}>
        <View style={{ position: 'absolute', left: 14, top: 30, width: 130, height: 120, borderRadius: 24, backgroundColor: '#DCE8D2' }} />
        <View style={{ position: 'absolute', right: 10, top: 60, width: 80, height: 130, borderRadius: 40, backgroundColor: '#D6E4CB' }} />
        <View style={{ position: 'absolute', left: 120, top: -20, width: 34, height: 300, backgroundColor: '#D9D5CA', transform: [{ rotate: '12deg' }] }} />
        <View style={{ position: 'absolute', left: -20, top: 140, width: 420, height: 32, backgroundColor: '#DDD9CE', transform: [{ rotate: '-8deg' }] }} />
        <Text style={{ position: 'absolute', left: 38, top: 50, fontSize: 12, fontWeight: '800', color: C.muted }}>TIP QC</Text>
        <Text style={{ position: 'absolute', right: 26, bottom: 20, fontSize: 11, color: C.muted, transform: [{ rotate: '8deg' }] }}>Aurora Blvd</Text>

        <Line style={{ left: 150, top: 82, width: 50, height: 4 }} />
        <Line style={{ left: 196, top: 82, width: 4, height: 62 }} />
        <Line style={{ left: 128, top: 140, width: 72, height: 4 }} />

        <View style={{ position: 'absolute', left: 134, top: 68, width: 32, height: 32, borderRadius: 16, backgroundColor: C.dark, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.yellow, fontSize: 12 }}>◆</Text>
        </View>
        <View style={{ position: 'absolute', left: 104, top: 126, width: 36, height: 36, borderRadius: 18, backgroundColor: C.yellow, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>{place.emoji}</Text>
        </View>

        <View style={{ position: 'absolute', left: 12, top: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: C.dark }}>ILLUSTRATIVE · NOT LIVE GPS</Text>
        </View>
      </View>

      <View style={[s.lbCard, { flexDirection: 'column', alignItems: 'stretch', marginBottom: 12 }]}>
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>FROM</Text>
        <Text style={[s.lbCardTitle, { marginBottom: 12 }]}>{campusLabel(university)} · Campus area</Text>
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>TO</Text>
        <Text style={s.lbCardTitle}>{place.name}</Text>
        <Text style={{ fontSize: 13, color: C.dark, marginTop: 6 }}>Aurora Blvd. near TIP QC, Cubao, QC</Text>
      </View>

      <Text style={{ fontSize: 14, color: C.dark, lineHeight: 21, marginBottom: 12 }}>
        Illustrative route: leave the campus area toward Aurora Blvd., then continue to the café nearby. Confirm the entrance and safe crossings locally.
      </Text>

      <Note text="Static campus-oriented route only, not turn-by-turn navigation. No live GPS, travel time or location tracking." />
    </LibPage>
  );
}
