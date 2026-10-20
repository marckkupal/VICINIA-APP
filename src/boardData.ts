export interface BoardPost { id: string; author: string; ago: string; text: string; votes: number; replies: number }
export interface BoardMember { name: string; role: 'Admin' | 'Moderator' | 'Member' }
export interface BoardDetailData {
  description: string; posts: number; showTitle: boolean; joinLabel?: string;
  members: BoardMember[]; feed: BoardPost[];
}

export const BOARD_DETAILS: Record<string, BoardDetailData> = {
  '1': {
    description: 'For TIP otakus! Share anime recs, watch parties, and cosplay events on campus.', posts: 128, showTitle: false,
    members: [
      { name: 'Maria Santos', role: 'Admin' }, { name: 'Ethan Matthew', role: 'Moderator' },
      { name: 'Luis Reyes', role: 'Member' }, { name: 'Patricia Ramos', role: 'Member' }, { name: 'Mark Castro', role: 'Member' },
    ],
    feed: [
      { id: 'a', author: 'Maria Santos', ago: '1h ago', text: 'Watch party this Friday at the TIP QC AVR! We’re screening a Studio Ghibli classic. Bring snacks 🍿', votes: 42, replies: 11 },
      { id: 'b', author: 'Luis Reyes', ago: '3h ago', text: 'Anyone going cosplay at the Org Fair? Let’s plan a group cosplay!', votes: 27, replies: 9 },
    ],
  },
  '2': {
    description: 'For TIP gamers! Co-op nights, esports scrims, and tabletop sessions on campus.', posts: 304, showTitle: true,
    members: [
      { name: 'Carlo Dizon', role: 'Admin' }, { name: 'Bea Villanueva', role: 'Moderator' },
      { name: 'Migo Tan', role: 'Member' }, { name: 'Aaron Lim', role: 'Member' }, { name: 'Sofia Ramos', role: 'Member' },
    ],
    feed: [
      { id: 'a', author: 'Carlo Dizon', ago: '1h ago', text: 'Valorant 5v5 scrims every Wednesday, 4 PM at the TIP QC computer lab. Sign up here!', votes: 38, replies: 14 },
      { id: 'b', author: 'Migo Tan', ago: '4h ago', text: 'Looking for teammates for the inter-college Mobile Legends tournament 🎮', votes: 21, replies: 12 },
    ],
  },
  '4': {
    description: 'Varsity updates, pickup games at the TIP QC gym, and fitness buddies for every level.', posts: 187, showTitle: true,
    members: [
      { name: 'Kevin Garcia', role: 'Admin' }, { name: 'Dana Flores', role: 'Moderator' },
      { name: 'Rico Mendoza', role: 'Member' }, { name: 'Tina Bautista', role: 'Member' }, { name: 'Joel Navarro', role: 'Member' },
    ],
    feed: [
      { id: 'a', author: 'Kevin Garcia', ago: '2h ago', text: 'Pickup basketball at the TIP QC gym tonight, 5 PM. All skill levels welcome!', votes: 33, replies: 10 },
      { id: 'b', author: 'Dana Flores', ago: '6h ago', text: 'Who’s joining the morning run around Cubao this Saturday? Meet at the main gate, 6 AM.', votes: 19, replies: 7 },
    ],
  },
  '6': {
    description: 'For TIP shutterbugs! Photo walks around Cubao, gear talk, and friendly critique.', posts: 96, showTitle: true,
    members: [
      { name: 'Mika Reyes', role: 'Admin' }, { name: 'Alex Santos', role: 'Moderator' },
      { name: 'Lia Cruz', role: 'Member' }, { name: 'Paolo Navarro', role: 'Member' }, { name: 'Jenny Aquino', role: 'Member' },
    ],
    feed: [
      { id: 'a', author: 'Mika Reyes', ago: '2h ago', text: 'Film walk this Saturday? Cubao Expo → Araneta City around golden hour. Beginners welcome!', votes: 24, replies: 8 },
      { id: 'b', author: 'Lia Cruz', ago: '5h ago', text: 'Any tips for affordable 35mm developing around Cubao? Budget is around ₱350.', votes: 16, replies: 19 },
    ],
  },
  '3': {
    description: 'Build nights, hackathons, and career tips for TIP techies and future engineers.', posts: 351, showTitle: true, joinLabel: 'JOIN',
    members: [
      { name: 'Marco Villanueva', role: 'Admin' },
      { name: 'Ellaine Ramos', role: 'Moderator' },
      { name: 'Ian Soriano', role: 'Member' },
      { name: 'Pat Lim', role: 'Member' },
      { name: 'Rhea Domingo', role: 'Member' },
    ],
    feed: [
      { id: 'a', author: 'Marco Villanueva', ago: '2h ago', text: 'Hackathon Night on Oct 14 at the TIP QC computer lab, 6 PM. Teams of 3–4, free pizza 🍕', votes: 61, replies: 22 },
      { id: 'b', author: 'Ian Soriano', ago: '7h ago', text: 'Resume review session for 3rd-year students next week. Drop your questions below!', votes: 37, replies: 9 },
    ],
  },
  '5': {
    description: 'Gigs, playlists, and jam sessions for TIP musicians and music lovers.', posts: 142, showTitle: false, joinLabel: 'JOIN',
    members: [
      { name: 'Isabel Lopez', role: 'Admin' },
      { name: 'Noel Aquino', role: 'Moderator' },
      { name: 'Gab Santiago', role: 'Member' },
      { name: 'Trish Velasco', role: 'Member' },
      { name: 'Dino Cruz', role: 'Member' },
    ],
    feed: [
      { id: 'a', author: 'Isabel Lopez', ago: '3h ago', text: 'Jam session Friday after class! Bring your instruments, we’ll have a drum kit ready 🥁', votes: 29, replies: 6 },
      { id: 'b', author: 'Gab Santiago', ago: '1d ago', text: 'Sharing our TIP QC study-beats playlist. Add your favorites!', votes: 44, replies: 15 },
    ],
  },
  '7': {
    description: 'Study groups, reviewers, and class help for every TIP college and program.', posts: 640, showTitle: false, joinLabel: 'JOIN',
    members: [
      { name: 'Angelica Torres', role: 'Admin' },
      { name: 'Ryan Castillo', role: 'Moderator' },
      { name: 'Hannah Reyes', role: 'Member' },
      { name: 'Jomar Dela Peña', role: 'Member' },
      { name: 'Kath Mercado', role: 'Member' },
    ],
    feed: [
      { id: 'a', author: 'Angelica Torres', ago: '1h ago', text: 'Calculus 2 reviewer is up! Study group meets tomorrow at the library, 1 PM.', votes: 56, replies: 18 },
      { id: 'b', author: 'Hannah Reyes', ago: '5h ago', text: 'Anyone have notes for Data Structures midterms? Happy to trade for Discrete Math.', votes: 31, replies: 13 },
    ],
  },
  '8': {
    description: 'Everything happening at TIP QC — org fairs, intramurals, and school-wide events.', posts: 512, showTitle: false, joinLabel: 'JOIN',
    members: [
      { name: 'Jasmine Cortez', role: 'Admin' },
      { name: 'Eric Salvador', role: 'Moderator' },
      { name: 'Clarisse Uy', role: 'Member' },
      { name: 'Bryan Mendez', role: 'Member' },
      { name: 'Mia Padilla', role: 'Member' },
    ],
    feed: [
      { id: 'a', author: 'Jasmine Cortez', ago: '1h ago', text: 'Org Fair 2026 is on Oct 8 at the TIP QC Quadrangle! Booth sign-ups close on Friday.', votes: 88, replies: 31 },
      { id: 'b', author: 'Eric Salvador', ago: '1d ago', text: 'Intramurals schedule is out! Check the pinned post for the full bracket.', votes: 52, replies: 17 },
    ],
  },
};

// Boards without hand-written demo content get a simple generic page.
export const fallbackDetail = (name: string): BoardDetailData => ({
  description: `A TIP campus community for ${name}. Demo content isn’t loaded for this board yet.`,
  posts: 0, showTitle: true, members: [], feed: [],
});
