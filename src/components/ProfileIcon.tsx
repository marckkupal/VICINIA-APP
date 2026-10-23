import { Text } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C } from '../theme';

export type ProfileIconName =
  | 'bookmark' | 'calendar' | 'message' | 'bell' | 'shield' | 'help' | 'settings'
  | 'pin' | 'check' | 'logout' | 'pencil' | 'close'
  | 'link' | 'image' | 'send' | 'tag' | 'list' | 'textLeft' | 'chevron'
  | 'mail' | 'lock' | 'user' | 'cap' | 'clock' | 'book' | 'eye' | 'eyeOff' | 'chevronDown' | 'chevronUp';

// Outline icons (Lucide, 24x24 grid) that match the tab bar, replacing the colour emojis on the Profile page.
export function ProfileIcon({ name, size = 20, color = C.dark }: { name: ProfileIconName; size?: number; color?: string }) {
  const p = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'bookmark' && <Path {...p} d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />}
      {name === 'calendar' && (<><Path {...p} d="M8 2v4" /><Path {...p} d="M16 2v4" /><Rect {...p} x={3} y={4} width={18} height={18} rx={2} /><Path {...p} d="M3 10h18" /></>)}
      {name === 'message' && <Path {...p} d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />}
      {name === 'bell' && (<><Path {...p} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><Path {...p} d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>)}
      {name === 'shield' && <Path {...p} d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />}
      {name === 'help' && (<><Circle {...p} cx={12} cy={12} r={10} /><Path {...p} d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><Path {...p} d="M12 17h.01" /></>)}
      {name === 'settings' && (<><Path {...p} d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><Circle {...p} cx={12} cy={12} r={3} /></>)}
      {name === 'pin' && (<><Path {...p} d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><Circle {...p} cx={12} cy={10} r={3} /></>)}
      {name === 'check' && (<><Path {...p} d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Path {...p} d="m9 11 3 3L22 4" /></>)}
      {name === 'logout' && (<><Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Path {...p} d="m16 17 5-5-5-5" /><Path {...p} d="M21 12H9" /></>)}
      {name === 'pencil' && <Path {...p} d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />}
      {name === 'close' && (<><Path {...p} d="M18 6 6 18" /><Path {...p} d="m6 6 12 12" /></>)}
      {name === 'link' && (<><Path {...p} d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><Path {...p} d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>)}
      {name === 'image' && (<><Rect {...p} x={3} y={3} width={18} height={18} rx={2} /><Circle {...p} cx={9} cy={9} r={2} /><Path {...p} d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>)}
      {name === 'send' && (<><Path {...p} d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><Path {...p} d="m21.854 2.147-10.94 10.939" /></>)}
      {name === 'tag' && (<><Path {...p} d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><Circle {...p} cx={7.5} cy={7.5} r={0.5} /></>)}
      {name === 'list' && (<><Path {...p} d="M3 12h.01" /><Path {...p} d="M3 18h.01" /><Path {...p} d="M3 6h.01" /><Path {...p} d="M8 12h13" /><Path {...p} d="M8 18h13" /><Path {...p} d="M8 6h13" /></>)}
      {name === 'textLeft' && (<><Path {...p} d="M21 6H3" /><Path {...p} d="M15 12H3" /><Path {...p} d="M17 18H3" /></>)}
      {name === 'mail' && (<><Rect {...p} x={2} y={4} width={20} height={16} rx={2} /><Path {...p} d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>)}
      {name === 'lock' && (<><Rect {...p} x={3} y={11} width={18} height={11} rx={2} /><Path {...p} d="M7 11V7a5 5 0 0 1 10 0v4" /></>)}
      {name === 'user' && (<><Path {...p} d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><Circle {...p} cx={12} cy={7} r={4} /></>)}
      {name === 'cap' && (<><Path {...p} d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><Path {...p} d="M22 10v6" /><Path {...p} d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>)}
      {name === 'clock' && (<><Circle {...p} cx={12} cy={12} r={10} /><Path {...p} d="M12 6v6l4 2" /></>)}
      {name === 'book' && (<><Path {...p} d="M12 7v14" /><Path {...p} d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>)}
      {name === 'eye' && (<><Path {...p} d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><Circle {...p} cx={12} cy={12} r={3} /></>)}
      {name === 'eyeOff' && (<><Path {...p} d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><Path {...p} d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><Path {...p} d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><Path {...p} d="m2 2 20 20" /></>)}
      {name === 'chevronDown' && <Path {...p} d="m6 9 6 6 6-6" />}
      {name === 'chevronUp' && <Path {...p} d="m18 15-6-6-6 6" />}
      {name === 'chevron' && <Path {...p} d="m9 18 6-6-6-6" />}
    </Svg>
  );
}

// Form fields were given emoji; this turns the known ones into the matching outline icon (other text is shown as-is).
const EMOJI_ICON: Record<string, ProfileIconName> = {
  '✉️': 'mail', '🔒': 'lock', '👤': 'user', '🎓': 'cap', '🕒': 'clock', '📖': 'book',
  '🗓️': 'calendar', '📅': 'calendar', '🏷️': 'tag', '💛': 'message',
};
export function EmojiIcon({ glyph, size = 18, color = C.muted }: { glyph: string; size?: number; color?: string }) {
  const name = EMOJI_ICON[glyph];
  return name ? <ProfileIcon name={name} size={size} color={color} /> : <Text style={{ fontSize: 14 }}>{glyph}</Text>;
}
