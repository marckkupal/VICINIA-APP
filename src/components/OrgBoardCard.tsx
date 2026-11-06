import { Text, TouchableOpacity, View } from 'react-native';
import type { OrgBoard } from '../content';
import { pickFeatured } from '../eventStatus';
import { C } from '../theme';
import { StatusBadge, UnconfirmedLabel, whenText } from './EventBadges';
import { SafeImage } from './SafeImage';

export const PENDING_TEXT = 'Description pending confirmation';

// The description, or the fixed "pending" line when a person has not confirmed it.
export function OrgDescription({ org, lines }: { org: OrgBoard; lines?: number }) {
  const pending = !org.descriptionVerified;
  return (
    <Text
      numberOfLines={lines}
      style={{ fontSize: 13, lineHeight: 19, color: C.muted, fontStyle: pending ? 'italic' : 'normal' }}>
      {pending ? PENDING_TEXT : org.description}
    </Text>
  );
}

export function TagRow({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
      {tags.map((t) => (
        <View key={t} style={{ backgroundColor: C.tint, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.dark }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

// One organization in the Boards directory: logo, full + short name, category, description, tags, and its featured event.
export function OrgBoardCard({ org, now, onPress }: { org: OrgBoard; now: number; onPress: () => void }) {
  const featured = pickFeatured(org.events, now, org.featuredEventId);
  return (
    <TouchableOpacity
      activeOpacity={0.85} onPress={onPress} accessibilityRole="button"
      accessibilityLabel={`${org.name}, ${org.category}. Opens details and events.`}
      style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 56 }}><SafeImage source={org.logo} lockRatio ratio={1} icon="🏛️" label={`${org.shortName} logo`} radius={28} /></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: C.dark }} numberOfLines={2}>{org.name}</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.muted, marginTop: 2 }}>{org.shortName} · {org.category}</Text>
        </View>
        <Text style={{ fontSize: 22, color: C.muted }}>›</Text>
      </View>
      <View style={{ marginTop: 10 }}><OrgDescription org={org} lines={3} /></View>
      <TagRow tags={org.tags} />
      {featured ? (
        <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1, color: C.muted, marginBottom: 8 }}>FEATURED EVENT</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 84 }}><SafeImage source={featured.poster} ratio={4 / 5} icon="🎟️" label={`${featured.title} poster`} radius={8} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark }} numberOfLines={2}>{featured.title}</Text>
              <Text style={{ fontSize: 12, color: C.muted, marginVertical: 4 }}>{whenText(featured)}</Text>
              <StatusBadge event={featured} now={now} />
              <View style={{ marginTop: 4 }}><UnconfirmedLabel event={featured} /></View>
            </View>
          </View>
        </View>
      ) : (
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>No events listed yet</Text>
      )}
    </TouchableOpacity>
  );
}
