import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { C } from '../theme';
import { useTabRequests } from '../navigation';
import { setTarget } from '../tour';
import { TourOverlay } from './TourOverlay';
import type { TabKey } from '../types';

const ACTIVE = '#FFC107';
const INACTIVE = '#A5A296';

// Lucide outline icons (24x24 grid), drawn with react-native-svg.
function Icon({ name, color }: { name: TabKey; color: string }) {
  const p = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {name === 'home' && (
        <>
          <Path {...p} d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
          <Path {...p} d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </>
      )}
      {name === 'explore' && (
        <>
          <Circle {...p} cx={12} cy={12} r={10} />
          <Polygon {...p} points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </>
      )}
      {name === 'boards' && (
        <>
          <Rect {...p} x={3} y={3} width={7} height={7} rx={1} />
          <Rect {...p} x={14} y={3} width={7} height={7} rx={1} />
          <Rect {...p} x={14} y={14} width={7} height={7} rx={1} />
          <Rect {...p} x={3} y={14} width={7} height={7} rx={1} />
        </>
      )}
      {name === 'events' && (
        <>
          <Path {...p} d="M8 2v4" />
          <Path {...p} d="M16 2v4" />
          <Rect {...p} x={3} y={4} width={18} height={18} rx={2} />
          <Path {...p} d="M3 10h18" />
        </>
      )}
      {name === 'profile' && (
        <>
          <Path {...p} d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <Circle {...p} cx={12} cy={7} r={4} />
        </>
      )}
    </Svg>
  );
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'explore', label: 'Explore' },
  { key: 'boards', label: 'Boards' },
  { key: 'events', label: 'Events' },
  { key: 'profile', label: 'Profile' },
];

export function TabBar({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  useTabRequests(onChange); // screens can switch tabs through goToTab()
  return (
    <>
    <View ref={(n) => setTarget('tabbar', n)} collapsable={false} style={{ flexDirection: 'row', backgroundColor: C.dark, paddingTop: 14, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
      {TABS.map((t) => {
        const on = tab === t.key;
        const color = on ? ACTIVE : INACTIVE;
        return (
          <View key={t.key} ref={(n) => setTarget(`tab-${t.key}`, n)} collapsable={false} style={{ flex: 1 }}>
            <TouchableOpacity style={{ alignItems: 'center' }} activeOpacity={0.7} onPress={() => onChange(t.key)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Icon name={t.key} color={color} />
              <Text style={{ fontSize: 13, marginTop: 5, color, fontWeight: on ? '800' : '500' }}>{t.label}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
    <TourOverlay />
    </>
  );
}
