import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { C } from '../theme';

export type OfficeIconName =
  | 'clock' | 'pin' | 'mail' | 'phone' | 'library' | 'plus' | 'crossOutline' | 'siren'
  | 'calendarPlus' | 'calendarCheck' | 'armchair' | 'message' | 'search'
  | 'stethoscope' | 'bandage' | 'fileHeart' | 'heartPulse' | 'bookOpen'
  | 'chevronRight' | 'arrowUpRight'
  | 'users' | 'cap' | 'heart' | 'shield' | 'leaf' | 'dollar' | 'help' | 'clipboardCheck' | 'calendar';

const HEART = 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

// Outline icons (Lucide, 24x24 grid) used by the Library and Clinic pages so they match the design instead of emoji.
export function OfficeIcon({ name, size = 20, color = C.dark, strokeWidth = 1.8 }: { name: OfficeIconName; size?: number; color?: string; strokeWidth?: number }) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'clock' && (<><Circle {...p} cx={12} cy={12} r={10} /><Path {...p} d="M12 6v6l4 2" /></>)}
      {name === 'pin' && (<><Path {...p} d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><Circle {...p} cx={12} cy={10} r={3} /></>)}
      {name === 'mail' && (<><Rect {...p} x={2} y={4} width={20} height={16} rx={2} /><Path {...p} d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>)}
      {name === 'phone' && <Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />}
      {name === 'library' && (<><Path {...p} d="m16 6 4 14" /><Path {...p} d="M12 6v14" /><Path {...p} d="M8 8v12" /><Path {...p} d="M4 4v16" /></>)}
      {name === 'plus' && (<><Path {...p} d="M12 5v14" /><Path {...p} d="M5 12h14" /></>)}
      {name === 'crossOutline' && <Path {...p} d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />}
      {name === 'siren' && (<><Path {...p} d="M7 18v-6a5 5 0 1 1 10 0v6" /><Path {...p} d="M5 21a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1z" /><Path {...p} d="M21 12h1" /><Path {...p} d="M18.5 4.5 18 5" /><Path {...p} d="M2 12h1" /><Path {...p} d="M12 2v1" /><Path {...p} d="m4.929 4.929.707.707" /><Path {...p} d="M12 12v6" /></>)}
      {name === 'calendarPlus' && (<><Path {...p} d="M8 2v4" /><Path {...p} d="M16 2v4" /><Path {...p} d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" /><Path {...p} d="M3 10h18" /><Path {...p} d="M16 19h6" /><Path {...p} d="M19 16v6" /></>)}
      {name === 'calendarCheck' && (<><Path {...p} d="M8 2v4" /><Path {...p} d="M16 2v4" /><Rect {...p} x={3} y={4} width={18} height={18} rx={2} /><Path {...p} d="M3 10h18" /><Path {...p} d="m9 16 2 2 4-4" /></>)}
      {name === 'armchair' && (<><Path {...p} d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><Path {...p} d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" /><Path {...p} d="M5 18v2" /><Path {...p} d="M19 18v2" /></>)}
      {name === 'message' && <Path {...p} d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />}
      {name === 'search' && (<><Circle {...p} cx={11} cy={11} r={8} /><Path {...p} d="m21 21-4.3-4.3" /></>)}
      {name === 'stethoscope' && (<><Path {...p} d="M11 2v2" /><Path {...p} d="M5 2v2" /><Path {...p} d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><Path {...p} d="M8 15a6 6 0 0 0 12 0v-3" /><Circle {...p} cx={20} cy={10} r={2} /></>)}
      {name === 'bandage' && (<><Path {...p} d="M10 10.01h.01" /><Path {...p} d="M10 14.01h.01" /><Path {...p} d="M14 10.01h.01" /><Path {...p} d="M14 14.01h.01" /><Path {...p} d="M18 6v11.5" /><Path {...p} d="M6 6v12" /><Rect {...p} x={2} y={6} width={20} height={12} rx={2} /></>)}
      {name === 'fileHeart' && (<><Path {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Path {...p} d="M14 2v6h6" /><G transform="translate(6.4 9.4) scale(0.4)"><Path {...p} strokeWidth={strokeWidth * 2.2} d={HEART} /></G></>)}
      {name === 'heartPulse' && (<><Path {...p} d={HEART} /><Path {...p} d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" /></>)}
      {name === 'bookOpen' && (<><Path {...p} d="M12 7v14" /><Path {...p} d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>)}
      {name === 'users' && (<><Path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><Circle {...p} cx={9} cy={7} r={4} /><Path {...p} d="M22 21v-2a4 4 0 0 0-3-3.87" /><Path {...p} d="M16 3.13a4 4 0 0 1 0 7.75" /></>)}
      {name === 'cap' && (<><Path {...p} d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><Path {...p} d="M22 10v6" /><Path {...p} d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>)}
      {name === 'heart' && <Path {...p} d={HEART} />}
      {name === 'shield' && <Path {...p} d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />}
      {name === 'leaf' && (<><Path {...p} d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><Path {...p} d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>)}
      {name === 'dollar' && (<><Circle {...p} cx={12} cy={12} r={10} /><Path {...p} d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><Path {...p} d="M12 18V6" /></>)}
      {name === 'help' && (<><Circle {...p} cx={12} cy={12} r={10} /><Path {...p} d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><Path {...p} d="M12 17h.01" /></>)}
      {name === 'clipboardCheck' && (<><Rect {...p} x={8} y={2} width={8} height={4} rx={1} /><Path {...p} d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><Path {...p} d="m9 14 2 2 4-4" /></>)}
      {name === 'calendar' && (<><Path {...p} d="M8 2v4" /><Path {...p} d="M16 2v4" /><Rect {...p} x={3} y={4} width={18} height={18} rx={2} /><Path {...p} d="M3 10h18" /></>)}
      {name === 'chevronRight' && <Path {...p} d="m9 18 6-6-6-6" />}
      {name === 'arrowUpRight' && (<><Path {...p} d="M7 7h10v10" /><Path {...p} d="M7 17 17 7" /></>)}
    </Svg>
  );
}
