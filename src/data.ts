import { C } from './theme';
import type { User, Post, Board } from './types';

export const POSTS: Post[] = [
  { id: '1', name: 'Vicinia', ini: 'VC', handle: '@vicinia', avatarBg: C.yellow, tag: 'Community', title: 'Weekend market finds', tint: '#E6EDFB', likes: 1200, comments: 48, live: true },
  { id: '2', name: 'Mika Reyes', ini: 'MR', handle: '@mikareyes', avatarBg: '#E3F0E4', tag: 'Photography', title: 'Golden hour on the rooftop', tint: '#FADFD6', likes: 61, comments: 9, live: true },
  { id: '3', name: 'Niock Silvero', ini: 'NS', handle: '@niocksilvero', avatarBg: '#E3F0E4', tag: 'Programming', title: 'Semicon Hackathon setup', tint: '#FBF0C4', likes: 48, comments: 12 },
  { id: '4', name: 'Angela Cruz', ini: 'AC', handle: '@angelacruz', avatarBg: '#E6EDFB', tag: 'Study Groups', title: 'Calculus 2 review sheets', tint: '#E3F0E4', likes: 35, comments: 27 },
];

export const BOARDS: Board[] = [
  { id: '1', name: 'Anime Club', members: 340, emoji: '🎌' },
  { id: '2', name: 'Gaming Society', members: 512, emoji: '🎮' },
  { id: '3', name: 'Programming & Tech', members: 680, emoji: '💻' },
  { id: '4', name: 'Athletic Union', members: 185, emoji: '⚽' },
  { id: '5', name: 'Music Coalition', members: 290, emoji: '🎵' },
  { id: '6', name: 'Photography Lab', members: 150, emoji: '📷' },
  { id: '7', name: 'Study Circles', members: 430, emoji: '📚' },
  { id: '8', name: 'Student Council', members: 1200, emoji: '🏛️' },
];

export const QUICK = [
  { label: 'Guidance', icon: '💛', bg: '#E3F0E4', border: '#CFE3D0' },
  { label: 'Library', icon: '📖', bg: '#FBF0C4', border: '#F0DD97' },
  { label: 'Clinic', icon: '➕', bg: '#FADFD6', border: '#EFC7BC' },
  { label: 'OSA', icon: '🎓', bg: '#E6EDFB', border: '#CBD6EE' },
];

export const SLIDES = [
  { icon: '🗺️', kicker: 'EXPLORE NEARBY', title: 'Good spots.\nJust around you.', body: 'Find your next café, food stop or study space around TIP Quezon City and Manila.' },
  { icon: '🎮', kicker: 'CAMPUS BOARDS', title: 'Your interests.\nYour people.', body: 'Into photography, gaming, music or academics? Join a board and start a conversation.' },
  { icon: '🗓️', kicker: 'CAMPUS EVENTS & WELLBEING', title: 'Be part of it.\nFeel supported.', body: 'Discover campus activities and find caring support from the Guidance Office or Clinic, whenever you need it.' },
];

export const SEED_USERS: User[] = [
  { name: 'Juan Dela Cruz', email: 'jdelacruz@tip.edu.ph', password: 'password123', university: 'Technological Institute of the Philippines Q.C.', program: 'BS Computer Science', year: '3rd year' },
];

export const LIBRARY = {
  name: 'Main Library',
  blurb: 'Find quiet study zones, collaborative rooms, print resources, and online journals for every program.',
  info: [
    { key: 'hours', label: 'OPENING HOURS', value: 'Mon–Fri · 7:00 AM–8:00 PM', icon: '🕒', bg: '#FDF1C4' },
    { key: 'location', label: 'LOCATION', value: 'PE Center, 2nd–4th Floors', icon: '📍', bg: '#FADFD6' },
    { key: 'contact', label: 'CONTACT', value: 'library.qc@tip.edu.ph · local 225', icon: '✉️', bg: '#E6EDFB' },
  ],
  email: 'library.qc@tip.edu.ph',
  plan: [
    { key: 'book', title: 'Book a study room', sub: 'Reserve a group room for up to 2 hours', icon: '🗓️', bg: '#FDF1C4' },
    { key: 'spaces', title: 'Explore study spaces', sub: 'Quiet, group, computer, and reading zones', icon: '🛋️', bg: '#E3F0E4' },
  ],
};

export const CLINIC = {
  name: 'Care on campus',
  blurb: 'First aid, health assessment, and basic medical care are available to enrolled TIP students and staff.',
  info: [
    { key: 'hours', label: 'CLINIC HOURS', value: 'Mon–Fri · 7:00 AM–6:00 PM', icon: '🕒', bg: '#FDF1C4' },
    { key: 'location', label: 'LOCATION', value: 'Tech Building, Ground Floor', icon: '📍', bg: '#FDF1C4' },
    { key: 'contact', label: 'CONTACT', value: '(02) 8911 0964 · local 126', icon: '📞', bg: '#E6EDFB' },
  ],
  phone: '0289110964',
  emergencyNote: 'Notify Campus Security immediately after.',
  services: [
    { key: 'consult', label: 'Consultation', icon: '🩺' },
    { key: 'firstaid', label: 'First aid', icon: '🩹' },
    { key: 'certs', label: 'Certificates', icon: '📄' },
  ],
};

export type PlaceKind = 'study' | 'food' | 'orgs';
export interface Place {
  id: string; name: string; kind: PlaceKind; type: string; price?: string;
  distance: string; status: string; emoji: string;
}
export const PLACES: Place[] = [
  { id: '1', name: 'Brew & Books Cafe', kind: 'food', type: 'Cafe', price: '₱120–250', distance: '0.3 km', status: 'Open now', emoji: '☕' },
  { id: '2', name: 'TIP QC Library Study Hall', kind: 'study', type: 'Study space', price: 'Free', distance: '0.5 km', status: 'Open until 9 PM', emoji: '📚' },
  { id: '3', name: 'TIP Photography Society Hub', kind: 'orgs', type: 'Campus community', distance: '0.8 km', status: 'Members here now', emoji: '📷' },
  { id: '4', name: 'Cubao Ramen House', kind: 'food', type: 'Restaurant', price: '₱180–350', distance: '1.2 km', status: 'Busy · 15 min wait', emoji: '🍜' },
];
