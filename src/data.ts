import { C } from './theme';
import type { User, Post, Board } from './types';

export const POSTS: Post[] = [
  { id: '1', name: 'Vicinia', ini: 'VC', handle: '@vicinia', avatarBg: C.yellow, tag: 'Community', title: 'Weekend market finds', tint: '#E6EDFB', likes: 1200, comments: 48, live: true },
  { id: '2', name: 'Mika Reyes', ini: 'MR', handle: '@mikareyes', avatarBg: '#E3F0E4', tag: 'Photography', title: 'Golden hour on the rooftop', tint: '#FADFD6', likes: 61, comments: 9, live: true },
  { id: '3', name: 'Niock Silvero', ini: 'NS', handle: '@niocksilvero', avatarBg: '#E3F0E4', tag: 'Programming', title: 'Semicon Hackathon setup', tint: '#FBF0C4', likes: 48, comments: 12 },
  { id: '4', name: 'Angela Cruz', ini: 'AC', handle: '@angelacruz', avatarBg: '#E6EDFB', tag: 'Study Groups', title: 'Calculus 2 review sheets', tint: '#E3F0E4', likes: 35, comments: 27 },
];

export const BOARDS: Board[] = [
  { id: '1', name: 'Anime Club', label: 'Anime', tagline: 'Talk, recs & watch parties', tint: '#F8E9E5', online: 24, newPosts: 31, members: 340, emoji: '🎌' },
  { id: '2', name: 'Gaming Club', label: 'Gaming', tagline: 'Co-op, esports & tabletop', tint: '#EDE8F6', online: 61, newPosts: 38, members: 512, emoji: '🎮' },
  { id: '3', name: 'Tech Club', label: 'Technology', tagline: 'Build nights & career tips', tint: '#E4F1EA', online: 47, newPosts: 40, members: 684, emoji: '💻' },
  { id: '4', name: 'Sports Club', label: 'Sports', tagline: 'Varsity, pickup & fitness', tint: '#E8F3EA', online: 33, newPosts: 27, members: 428, emoji: '🏀' },
  { id: '5', name: 'Music Club', label: 'Music', tagline: 'Gigs, playlists & jam sessions', tint: '#E6EBFB', online: 19, newPosts: 19, members: 276, emoji: '🎧' },
  { id: '6', name: 'Photography Club', label: 'Photography', tagline: 'Shoots, gear & photo walks', tint: '#FDF1C4', online: 38, newPosts: 42, members: 215, emoji: '📷' },
  { id: '7', name: 'Academics Hub', label: 'Academics', tagline: 'Study groups & class help', tint: '#FFF8E1', online: 72, newPosts: 36, members: 1200, emoji: '📚' },
  { id: '8', name: 'Campus Events', label: 'Campus Events', tagline: 'What\u2019s happening this week', tint: '#F5EAE6', online: 85, newPosts: 33, members: 1500, emoji: '🎪' },
];

export const QUICK = [
  { label: 'Guidance', icon: '💛', bg: '#E8F2EA', border: '#D3E5D6' },
  { label: 'Library', icon: '📖', bg: '#FDF3C8', border: '#F3E3A0' },
  { label: 'Clinic', icon: '➕', bg: '#F8E7E2', border: '#EBCFC7' },
  { label: 'OSA', icon: '🎓', bg: '#E6EDFB', border: '#CBD6EE' },
];

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

export type PlaceKind = 'study' | 'food' | 'orgs' | 'shops';
export interface Place {
  id: string; name: string; kind: PlaceKind; type: string; price?: string;
  distance: string; status: string; emoji: string;
  map?: { x: number; y: number }; // illustrative position on the Explore map, in % (not GPS)
  // Set for places posted by business owners (see businesses.ts).
  business?: boolean; address?: string; hours?: string; contact?: string; about?: string; ownerEmail?: string;
}
export const PLACES: Place[] = [
  { id: '1', name: 'Brew & Books Cafe', kind: 'food', type: 'Cafe', price: '₱120–250', distance: '0.3 km', status: 'Open now', emoji: '☕', map: { x: 27, y: 58 } },
  { id: '2', name: 'TIP QC Library Study Hall', kind: 'study', type: 'Study space', price: 'Free', distance: '0.5 km', status: 'Open until 9 PM', emoji: '📚', map: { x: 55, y: 24 } },
  { id: '3', name: 'TIP Photography Society Hub', kind: 'orgs', type: 'Campus community', distance: '0.8 km', status: 'Members here now', emoji: '📷', map: { x: 62, y: 56 } },
  { id: '4', name: 'Cubao Ramen House', kind: 'food', type: 'Restaurant', price: '₱180–350', distance: '1.2 km', status: 'Busy · 15 min wait', emoji: '🍜', map: { x: 84, y: 76 } },
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
  id: string; kind: string; fee: number; title: string; icon: string; bg: string;
  mon: string; day: string; dateLong: string; dateShort: string; time: string;
  venue: string; campus: string; about: string;
  host?: 'guidance'; // set when the event is organized by that office
}
const GENERIC_ABOUT = 'More details for this campus event will be shared by the organizer.';
// Sample events for the demo.
export const EVENTS: CampusEvent[] = [
  {
    id: 'film', kind: 'WORKSHOP', fee: 150, title: 'Intro to Film Photography', icon: '📷', bg: '#FDF1C4',
    mon: 'OCT', day: '10', dateLong: 'Saturday, October 10, 2026', dateShort: 'October 10, 2026', time: '2:00 PM',
    venue: 'TIP QC Room 201', campus: 'TIP Quezon City',
    about: 'Explore the basics of film photography, from choosing a camera to working with light. A campus workshop for curious beginners and fellow photography enthusiasts.',
  },
  {
    id: 'hack', kind: 'TECHNOLOGY', fee: 0, title: 'Hackathon Night', icon: '💻', bg: '#E6EDFB',
    mon: 'OCT', day: '14', dateLong: 'Wednesday, October 14, 2026', dateShort: 'October 14, 2026', time: '6:00 PM',
    venue: 'TIP QC Computer Lab', campus: 'TIP Quezon City',
    about: 'Bring your ideas to a campus build night. Work alongside fellow students, explore a problem, and turn a small concept into a project.',
  },
  {
    id: 'semicon', kind: 'TECHNOLOGY', fee: 0, title: 'Semicon Hackathon', icon: '💻', bg: '#E6EDFB',
    mon: 'OCT', day: '28', dateLong: 'Wednesday, October 28, 2026', dateShort: 'October 28, 2026', time: '1:00 PM',
    venue: 'Seminar Hall Bldg', campus: 'TIP Quezon City', about: GENERIC_ABOUT,
  },
  {
    id: 'midterms', kind: 'ACADEMIC', fee: 0, title: 'Midterms Review Night', icon: '📚', bg: '#E3F0E4',
    mon: 'NOV', day: '03', dateLong: 'Tuesday, November 3, 2026', dateShort: 'November 3, 2026', time: '6:00 PM',
    venue: 'TIP QC Study Plaza', campus: 'TIP Quezon City', about: GENERIC_ABOUT,
  },
  {
    id: 'wellness', kind: 'WELLNESS', fee: 0, title: 'Wellness Day', icon: '🌿', bg: '#E3F0E4',
    mon: 'NOV', day: '12', dateLong: 'Thursday, November 12, 2026', dateShort: 'November 12, 2026', time: '9:00 AM',
    venue: 'Clinic & Guidance Office', campus: 'TIP Quezon City', about: GENERIC_ABOUT, host: 'guidance',
  },
  {
    id: 'stress', kind: 'WELLNESS', fee: 0, title: 'Stress Management Workshop', icon: '🧘', bg: '#E3F0E4',
    mon: 'NOV', day: '19', dateLong: 'Thursday, November 19, 2026', dateShort: 'November 19, 2026', time: '1:00 PM',
    venue: 'Guidance Office', campus: 'TIP Quezon City', about: GENERIC_ABOUT, host: 'guidance',
  },
  {
    id: 'orient', kind: 'WELLNESS', fee: 0, title: 'Freshman Adjustment Session', icon: '🌱', bg: '#FDF1C4',
    mon: 'DEC', day: '03', dateLong: 'Thursday, December 3, 2026', dateShort: 'December 3, 2026', time: '10:00 AM',
    venue: 'Guidance Office', campus: 'TIP Quezon City', about: GENERIC_ABOUT, host: 'guidance',
  },
];

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
// Places without a listed distance (e.g. posted by a business owner) are kept.
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
  office: 'osa', name: 'Office of Student Affairs', short: 'OSA', refPrefix: 'OSA', heroBg: '#E6EDFB', heroIcon: 'users',
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
  office: 'guidance', name: 'Guidance Office', short: 'Guidance', refPrefix: 'GUI', heroBg: '#F7C84B', heroIcon: 'heart',
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

