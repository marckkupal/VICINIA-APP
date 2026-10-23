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
export interface Post {
  id: string; name: string; ini: string; handle: string; avatarBg: string;
  tag: string; title: string; tint: string;
  likes: number; comments: number; live?: boolean;
  media?: string[];
}
export interface Board {
  id: string; name: string; members: number; emoji: string;
  // Used by the Boards screens (optional so other screens don't need them)
  label?: string; tagline?: string; tint?: string; online?: number; newPosts?: number;
}

// OSA / Guidance requests (inquiries and appointment requests) saved on this device.
export type OfficeKey = 'osa' | 'guidance';
export interface OfficeRequest {
  id: string; ref: string; office: OfficeKey; kind: 'inquiry' | 'appointment';
  topic: string; message: string; name: string; email: string;
  date?: string; time?: string;
  status: 'submitted' | 'cancelled'; createdAt: number;
}
