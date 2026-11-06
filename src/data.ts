import type { ImageSourcePropType } from 'react-native';
import { C } from './theme';
import type { User, Post, Board } from './types';
import { loadOrganizations, loadEvents } from './content';

export const POSTS: Post[] = [
  { id: '1', name: 'Vicinia', ini: 'VC', handle: '@vicinia', avatarBg: C.yellow, tag: 'Community', title: 'Weekend market finds', tint: '#E6EDFB', likes: 1200, comments: 48, live: true },
  { id: '2', name: 'Mika Reyes', ini: 'MR', handle: '@mikareyes', avatarBg: '#E3F0E4', tag: 'Photography', title: 'Golden hour on the rooftop', tint: '#FADFD6', likes: 61, comments: 9, live: true },
  { id: '3', name: 'Niock Silvero', ini: 'NS', handle: '@niocksilvero', avatarBg: '#E3F0E4', tag: 'Programming', title: 'Semicon Hackathon setup', tint: '#FBF0C4', likes: 48, comments: 12 },
  { id: '4', name: 'Angela Cruz', ini: 'AC', handle: '@angelacruz', avatarBg: '#E6EDFB', tag: 'Study Groups', title: 'Calculus 2 review sheets', tint: '#E3F0E4', likes: 35, comments: 27 },
];

// Organizations/boards come from src/content/organizations/**/organization.json (see content/index.ts). Edit the JSON, not this file.
export const BOARDS: Board[] = loadOrganizations();

export const QUICK = [
  { label: 'Guidance', icon: '💛', bg: '#E8F2EA', border: '#D3E5D6' },
  { label: 'Library', icon: '📖', bg: '#FDF3C8', border: '#F3E3A0' },
  { label: 'Clinic', icon: '➕', bg: '#F8E7E2', border: '#EBCFC7' },
  { label: 'OSA', icon: '🎓', bg: '#E6EDFB', border: '#CBD6EE' },
];

// Each office page uses the same color as its tile on Home (QUICK above): the hero card, its border, and the small icons inside.
const tile = (label: string) => QUICK.find((q) => q.label === label)!;
export const OFFICE_THEME = {
  guidance: { bg: tile('Guidance').bg, border: tile('Guidance').border, accent: C.green },
  library: { bg: tile('Library').bg, border: tile('Library').border, accent: C.yellow },
  clinic: { bg: tile('Clinic').bg, border: tile('Clinic').border, accent: C.orange },
  osa: { bg: tile('OSA').bg, border: tile('OSA').border, accent: '#3D5FC4' },
};

export const SLIDES = [
  { icon: '🗺️', kicker: 'EXPLORE NEARBY', title: 'Good spots.\nJust around you.', body: 'Find your next café, food stop or study space on and right around the TIP Quezon City campus.' },
  { icon: '🎮', kicker: 'CAMPUS BOARDS', title: 'Your interests.\nYour people.', body: 'Into photography, gaming, music or academics? Join a board and start a conversation.' },
  { icon: '🗓️', kicker: 'CAMPUS EVENTS & WELLBEING', title: 'Be part of it.\nFeel supported.', body: 'Discover campus activities and find caring support from the Guidance Office or Clinic, whenever you need it.' },
];

export const SEED_USERS: User[] = [
  { name: 'Juan Dela Cruz', email: 'jdelacruz@tip.edu.ph', password: 'password123', university: 'Technological Institute of the Philippines Q.C.', program: 'BSCS', year: '3rd year' },
];

export const LIBRARY = {
  name: 'Main Library',
  blurb: 'Find quiet study zones, collaborative rooms, print resources, and online journals for every program.',
  info: [
    { key: 'hours', label: 'OPENING HOURS', value: 'Mon–Fri · 7:00 AM–8:00 PM', icon: 'clock', bg: '#FDF1C4' },
    { key: 'location', label: 'LOCATION', value: 'PE Center, 2nd–4th Floors', icon: 'pin', bg: '#F8E6E1' },
    { key: 'contact', label: 'CONTACT', value: 'library.qc@tip.edu.ph · local 225', icon: 'mail', bg: '#E6EDFB' },
  ],
  email: 'library.qc@tip.edu.ph',
  plan: [
    { key: 'book', title: 'Book a study room', sub: 'Reserve a group room for up to 2 hours', icon: 'calendarPlus', bg: '#FDF1C4' },
    { key: 'spaces', title: 'Explore study spaces', sub: 'Quiet, group, computer, and reading zones', icon: 'armchair', bg: '#E3F0E4' },
  ],
};

export const CLINIC = {
  name: 'Care on campus',
  blurb: 'First aid, health assessment, and basic medical care are available to enrolled TIP students and staff.',
  info: [
    { key: 'hours', label: 'CLINIC HOURS', value: 'Mon–Fri · 7:00 AM–6:00 PM', icon: 'clock', bg: '#F8E6E1' },
    { key: 'location', label: 'LOCATION', value: 'Tech Building, Ground Floor', icon: 'pin', bg: '#FDF1C4' },
    { key: 'contact', label: 'CONTACT', value: '(02) 8911 0964 · local 126', icon: 'phone', bg: '#E6EDFB' },
  ],
  phone: '0289110964',
  emergencyNote: 'Notify Campus Security immediately after.',
  services: [
    { key: 'consult', label: 'Consultation', icon: 'stethoscope' },
    { key: 'firstaid', label: 'First aid', icon: 'bandage' },
    { key: 'certs', label: 'Certificates', icon: 'fileHeart' },
  ],
};

// Student/campus discovery only. Business listings ("shops") are out of scope for Explore.
export type PlaceKind = 'study' | 'food' | 'orgs';
export interface Place {
  id: string; name: string; kind: PlaceKind; type: string; price?: string;
  distance: string; status: string; emoji: string;
  /** Building or area inside the campus, shown in the map popup when known. Left out when not confirmed. */
  building?: string;
  /** Which campus (see geo.ts CAMPUSES) this place belongs to. Defaults to TIP Quezon City. */
  campusId?: string;
  /** Real, verified position. A place with no coord, an invalid coord, or one outside its campus geofence is listed but never pinned (see geo.ts). */
  coord?: { lat: number; lng: number };
}
// The four places below are sample listings. Their old hand-typed "approximate" coordinates were removed: they were measured
// against an unverified campus centre and could not be checked. Add `coord` only from a verified source (e.g. OpenStreetMap).
export const PLACES: Place[] = [
  { id: '1', name: 'Brew & Books Cafe', kind: 'food', type: 'Cafe', price: '₱120–250', distance: '0.3 km', status: 'Open now', emoji: '☕' },
  { id: '2', name: 'TIP QC Library Study Hall', kind: 'study', type: 'Study space', price: 'Free', distance: '0.5 km', status: 'Open until 9 PM', emoji: '📚', building: 'PE Center, 2nd–4th Floors' },
  { id: '3', name: 'TIP Photography Society Hub', kind: 'orgs', type: 'Campus community', distance: '0.8 km', status: 'Members here now', emoji: '📷' },
  { id: '4', name: 'Cubao Ramen House', kind: 'food', type: 'Restaurant', price: '₱180–350', distance: '1.2 km', status: 'Busy · 15 min wait', emoji: '🍜' },
];

export type LibKind = 'book' | 'eresource';
export interface LibResource {
  id: string; kind: LibKind; title: string; byline: string; meta: string;
  icon: string; bg: string; avail: string; availMuted?: boolean;
  heroSub: string; authors: string; about: string; callNumber: string; location: string; keywords: string;
}
// Sample catalog entries for the demo. Not real holdings.
export const LIB_RESOURCES: LibResource[] = [
  {
    id: 'algo', kind: 'book', title: 'Introduction to Algorithms', byline: 'Cormen et al. · 4th ed. · 2022',
    meta: 'Book · QA76.6 .C662 2022', icon: '📘', bg: '#E6EDFB', avail: 'Demo availability · 2 copies available',
    heroSub: '4th edition · 2022 · MIT Press', authors: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest & Clifford Stein',
    about: 'A comprehensive introduction to algorithms, data structures, and techniques for analyzing computational problems. Useful for programming and computer science coursework.',
    callNumber: 'QA76.6 .C662 2022', location: 'Main Library · PE Center, 2nd–4th Floors',
    keywords: 'computer science algorithms data structures programming',
  },
  {
    id: 'network', kind: 'book', title: 'Computer Networking: A Top-Down Approach', byline: 'Kurose & Ross · 8th ed. · 2021',
    meta: 'Book · Computer networks', icon: '📗', bg: '#E3F0E4', avail: 'Demo availability · For library use', availMuted: true,
    heroSub: '8th edition · 2021 · Pearson', authors: 'James F. Kurose & Keith W. Ross',
    about: 'Introduces computer networks from the application layer down to the link layer. Useful for networking and systems coursework.',
    callNumber: 'Sample call number', location: 'Main Library · PE Center, 2nd–4th Floors',
    keywords: 'computer science networking internet protocols',
  },
  {
    id: 'acm', kind: 'eresource', title: 'ACM Digital Library', byline: 'Research articles & conference proceedings',
    meta: 'E-resource · Computing & information technology', icon: '📖', bg: '#FDF1C4', avail: 'Demo access preview',
    heroSub: 'E-resource · Computing & information technology', authors: 'Association for Computing Machinery',
    about: 'Research articles and conference proceedings covering computing and information technology. Useful for research papers and capstone literature reviews.',
    callNumber: 'Online resource', location: 'Library website · Campus network or student login',
    keywords: 'computer science research journals articles computing',
  },
];

export interface CampusEvent {
  id: string; kind: string;
  fee: number | null;     // null = the organizer did not list a fee (never shown as "Free")
  title: string; icon: string; bg: string;
  mon: string; day: string; dateLong: string; dateShort: string; time: string;
  venue: string; campus: string; about: string;
  host?: 'guidance' | 'osa'; // set when the event is organized by that office
  startsAt?: number;      // start time in ms since epoch (events from the backend); used for ordering
  endsAt?: number;        // end time in ms since epoch, when known
  poster?: ImageSourcePropType; // event poster; shown at its own aspect ratio, never cropped
  verifiedByHuman?: boolean;    // false = a person has not confirmed the details yet; the app shows "Details unconfirmed"
  dateTba?: true;               // no date announced yet; shown as "Date TBA"
  organizationId?: string;      // the organization (content/organizations/<org>) that hosts this event
  local?: true;           // posted on this device before events were stored on the server
  endTime?: string;       // e.g. '5:00 PM', shown as a range on the details page
  address?: string;       // street address under the venue
  organizer?: string;     // shown in the "Organized by" card
  going?: number;         // "1,248 students are going"
  featured?: boolean;     // big dark card at the top of Events
  image?: ImageSourcePropType; // hero photo: { uri: 'https://…' } or require('./assets/…')
}
// SAMPLE DATA, NOT USED BY THE APP. Events now come from Firestore (see eventsApi.ts / eventsStore.ts).
// Kept only as a fixture for tests and for reference when seeding the `events` collection.
// Source of truth: src/content/organizations/**/event.json (see content/index.ts).
export const EVENTS: CampusEvent[] = loadEvents();

// Academic programs offered; the abbreviation is what gets saved on the student's profile.
export const PROGRAMS = [
  { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
  { code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
  { code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering' },
  { code: 'BSDSA', name: 'Bachelor of Science in Data Science and Analytics' },
  { code: 'BSIS', name: 'Bachelor of Science in Information Systems' },
] as const;

// Maps older free-text values (e.g. "BS Computer Science") onto a program code, if one matches.
export const programCode = (v: string) => {
  const t = v.trim().toLowerCase();
  const hit = PROGRAMS.find((p) => p.code.toLowerCase() === t || p.name.toLowerCase() === t || t.replace(/^bs\s+/, '') === p.name.toLowerCase().replace('bachelor of science in ', ''));
  return hit?.code ?? v;
};

export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Irregular'] as const;

// Explore Nearby only covers the TIP Quezon City campus and its immediate surroundings.
export const EXPLORE_SCOPE = { campus: 'TIP Quezon City', maxDistanceKm: 1 } as const;
// Places without a listed distance are kept.
export const inExploreScope = (distance?: string) => {
  const km = parseFloat(distance ?? '');
  return Number.isNaN(km) || km <= EXPLORE_SCOPE.maxDistanceKm;
};

/* ---------- OSA and Guidance ----------
   Sample content for the prototype. Hours, rooms, phone numbers and processes are intentionally
   not listed: confirm them with the offices before shipping. */
export interface OfficeService {
  key: string; title: string; sub: string; icon: string; bg: string;
  about: string; include: string[];
  action: 'inquiry' | 'appointment' | 'event' | 'info';
  topic?: string; eventId?: string;
}
export interface OfficeInfoRow { key: string; label: string; value: string; icon: string; bg: string }
export interface OfficeData {
  office: 'osa' | 'guidance'; name: string; short: string; refPrefix: string; blurb: string; heroBg: string; heroIcon: string;
  heroTitle?: string; tagline: string; // headline inside the hero card; subtitle under the page title
  info: OfficeInfoRow[]; topics: string[]; services: OfficeService[]; announcementIds: string[];
  appointmentSteps?: { title: string; body: string }[]; // simple how-to shown instead of a booking form
}

export const OSA: OfficeData = {
  office: 'osa', name: 'Office of Student Affairs', short: 'OSA', refPrefix: 'OSA', heroBg: OFFICE_THEME.osa.bg, heroIcon: 'users',
  heroTitle: 'Your campus life starts here', tagline: 'Office of Student Affairs',
  blurb: 'Get support for student activities, organizations, leadership, scholarships, and campus participation.',
  info: [
    { key: 'hours', label: 'OFFICE HOURS', value: 'Mon–Fri · 8:00 AM–5:00 PM', icon: 'clock', bg: '#E6EDFB' },
    { key: 'location', label: 'LOCATION', value: 'Administration Building, 2nd Floor', icon: 'pin', bg: '#FDF1C4' },
    { key: 'contact', label: 'CONTACT', value: 'osa.qc@tip.edu.ph · local 221', icon: 'mail', bg: '#E3F0E4' },
  ],
  topics: ['Student organizations', 'Scholarships & assistance', 'Campus events', 'Forms & permits', 'Student concern or feedback', 'General inquiry'],
  announcementIds: ['semicon', 'midterms'],
  services: [
    {
      key: 'orgs', title: 'Student organizations', sub: 'Browse groups, activities, and accreditation', icon: 'users', bg: '#E6EDFB', action: 'inquiry', topic: 'Student organizations',
      about: 'Ask the office about student organizations on campus, including activities and accreditation. You can also browse campus clubs on the Boards tab.',
      include: ['The organization you are asking about', 'Your program and year level', 'Your question or request'],
    },
    {
      key: 'scholar', title: 'Scholarships & assistance', sub: 'View aid programs and application guidance', icon: 'dollar', bg: '#FDF1C4', action: 'inquiry', topic: 'Scholarships & assistance',
      about: 'Ask which aid programs are available and how to apply. The office can point you to requirements and schedules.',
      include: ['The program you are interested in', 'Your program and year level', 'Any deadlines you are aware of'],
    },
    {
      key: 'events', title: 'Events', sub: 'Campus calendar', icon: 'calendar', bg: '#E3F0E4', action: 'inquiry', topic: 'Campus events',
      about: 'Ask about campus activities, venues, or how to take part. Upcoming events are listed under Announcements and on the Events tab.',
      include: ['The event or activity name', 'The date, if you know it', 'What you would like to find out'],
    },
    {
      key: 'requests', title: 'Requests', sub: 'Forms & permits', icon: 'clipboardCheck', bg: '#E3F0E4', action: 'inquiry', topic: 'Forms & permits',
      about: 'Ask about forms and permits for student activities, such as event approvals and facility use.',
      include: ['The form or permit you need', 'The activity and date it is for', 'Your organization, if any'],
    },
  ],
};

export const GUIDANCE: OfficeData = {
  office: 'guidance', name: 'Guidance Office', short: 'Guidance', refPrefix: 'GUI', heroBg: OFFICE_THEME.guidance.bg, heroIcon: 'heart',
  heroTitle: 'You don’t have to figure it out alone.', tagline: 'Confidential support from people who care',
  blurb: 'Sessions are private, free for enrolled TIP students, and available online or in person.',
  info: [
    { key: 'hours', label: 'OFFICE HOURS', value: 'Not listed in this prototype', icon: 'clock', bg: '#FDF1C4' },
    { key: 'location', label: 'LOCATION', value: 'Building 6 - 6th Floor', icon: 'pin', bg: '#E3F0E4' },
    { key: 'contact', label: 'CONTACT', value: 'Request or inquire in the app', icon: 'mail', bg: '#E6EDFB' },
  ],
  topics: ['Personal or emotional concern', 'Academic stress or workload', 'Relationships or family', 'Adjusting to campus life', 'Not sure yet'],
  announcementIds: ['wellness', 'stress', 'orient'], // events organized by the Guidance Office (see EVENTS host)
  // Sample steps for the prototype. Confirm the real process with the office before shipping.
  appointmentSteps: [
    { title: 'Visit the office', body: 'Drop by the Guidance Office (Building 6 - 6th Floor) during office hours. Bring your student ID.' },
    { title: 'Tell the staff', body: 'Say you would like to set an appointment. You do not need to explain everything. A short reason is enough.' },
    { title: 'Pick a time', body: 'The staff will check the counselor’s schedule and agree on a day and time with you.' },
    { title: 'Show up', body: 'Arrive a few minutes early. Sessions are private. If you cannot make it, tell the office so the slot can be reused.' },
  ],
  services: [],
};

