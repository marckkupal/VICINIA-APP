// Responsive sizes for the Events screens. Pure function so it can be tested without a device.
// Breakpoints: small phone (< 360 pt), phone, tablet / large (>= 700 pt).
export const TOUCH_MIN = 44; // smallest tappable size, in points

export interface EventLayout {
  size: 'small' | 'phone' | 'tablet';
  maxWidth: number | undefined; // content column on large screens (centered)
  tile: number;                 // date tile on a row
  weekGap: number;              // gap between week-strip days
  featuredTitle: number;
  featuredMinHeight: number;
  heroHeight: number;
  heroTitle: number;
}

export function eventLayout(width: number): EventLayout {
  if (!(width > 0)) width = 390; // unknown width: assume a normal phone
  if (width < 360) return { size: 'small', maxWidth: undefined, tile: 58, weekGap: 4, featuredTitle: 20, featuredMinHeight: 140, heroHeight: 230, heroTitle: 26 };
  if (width >= 700) return { size: 'tablet', maxWidth: 720, tile: 72, weekGap: 8, featuredTitle: 28, featuredMinHeight: 190, heroHeight: 340, heroTitle: 34 };
  return { size: 'phone', maxWidth: undefined, tile: 66, weekGap: 6, featuredTitle: 24, featuredMinHeight: 160, heroHeight: 270, heroTitle: 30 };
}
