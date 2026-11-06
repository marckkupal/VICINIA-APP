export type TabKey = 'home' | 'explore' | 'boards' | 'events' | 'profile';
export type Stage = 'onboarding' | 'welcome' | 'login' | 'signup' | 'forgot' | 'app';

export interface User {
  name: string;
  email: string;
  password: string; // plain text: mock only, use a real backend before shipping
  university: string;
  program: string;
  year: string;
  avatarUri?: string;
}
// Where a post made from the composer lives. Boards are not listed here: board posts are their own collection, keyed by board_id (see boardPosts.ts).
export type PostDestination = 'home' | 'explore';
// Geographic data for posts on geographically bound feeds (Explore). lat/lng are present when the location is a known place.
export interface PostLocation { name: string; placeId?: string; lat?: number; lng?: number }
export interface Post {
  id: string; name: string; ini: string; handle: string; avatarBg: string;
  tag: string; title: string; tint: string;
  likes: number; comments: number; live?: boolean;
  media?: string[];
  // Added with the shared composer. All optional so older saved posts and the sample POSTS keep working.
  destination?: PostDestination; body?: string; link?: string; location?: PostLocation; authorEmail?: string;
}
export interface Board {
  id: string; name: string; members: number; emoji: string;
  // Used by the Boards screens (optional so other screens don't need them)
  label?: string; tagline?: string; tint?: string; online?: number; newPosts?: number;
  // Set on boards people create from the Boards page (the built-in boards use `label` as their category).
  category?: string; description?: string;
  // Starter boards whose details are not confirmed yet carry a visible marker (e.g. '[Sample Event]'); counts are hidden for them.
  sample?: boolean; sampleLabel?: string;
  // Bundled logo resolved by content/index.ts from the `logo` path in organization.json.
  logo?: import('react-native').ImageSourcePropType; createdBy?: string; createdByName?: string; createdAt?: number;
}

// OSA / Guidance requests (inquiries and appointment requests) saved on this device.
export type OfficeKey = 'osa' | 'guidance';
export interface OfficeRequest {
  id: string; ref: string; office: OfficeKey; kind: 'inquiry' | 'appointment';
  topic: string; message: string; name: string; email: string;
  date?: string; time?: string;
  status: 'submitted' | 'cancelled'; createdAt: number;
}
