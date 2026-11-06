import { loadJSON, saveJSON } from './persist';

// Sample campus members and chat threads for the demo. Not real people.
export interface Person {
  id: string; name: string; handle: string; bg: string;
  program: string; year: string; campus: string; bio: string;
  interests: string[]; boards: number; events: number; posts: number;
}

export const PEOPLE: Record<string, Person> = {
  mika: {
    id: 'mika', name: 'Mika Reyes', handle: '@mikareyes', bg: '#E3F0E4', program: 'BSIT', year: '2nd year', campus: 'TIP Quezon City',
    bio: 'Film and golden-hour chaser. Admin of the Photography Club; beginners always welcome on photo walks.',
    interests: ['Photography', 'Film', 'Cafés'], boards: 5, events: 8, posts: 24,
  },
  angela: {
    id: 'angela', name: 'Angela Cruz', handle: '@angelacruz', bg: '#E6EDFB', program: 'BSCS', year: '3rd year', campus: 'TIP Quezon City',
    bio: 'Calculus survivor. I share review sheets and run study groups at the library.',
    interests: ['Study groups', 'Math', 'Algorithms'], boards: 4, events: 5, posts: 31,
  },
  carlo: {
    id: 'carlo', name: 'Carlo Dizon', handle: '@carlodizon', bg: '#FDF1C4', program: 'BSCpE', year: '3rd year', campus: 'TIP Quezon City',
    bio: 'Runs the Gaming Club scrims. Valorant on Wednesdays, board games whenever.',
    interests: ['Gaming', 'Esports', 'Hardware'], boards: 3, events: 6, posts: 18,
  },
  ian: {
    id: 'ian', name: 'Ian Soriano', handle: '@iansoriano', bg: '#EDE6F7', program: 'BSIS', year: '4th year', campus: 'TIP Quezon City',
    bio: 'Capstone season. Happy to review résumés and talk about internships.',
    interests: ['Careers', 'Web dev', 'Hackathons'], boards: 4, events: 9, posts: 40,
  },
  angelica: {
    id: 'angelica', name: 'Angelica Torres', handle: '@angelicatorres', bg: '#F8E9E5', program: 'BSDSA', year: '3rd year', campus: 'TIP Quezon City',
    bio: 'Admin of the Academics Hub. Reviewers, notes and study sessions.',
    interests: ['Data science', 'Reviewers', 'Study groups'], boards: 6, events: 7, posts: 52,
  },
  marco: {
    id: 'marco', name: 'Marco Villanueva', handle: '@marcovillanueva', bg: '#E3F0E4', program: 'BSCS', year: '4th year', campus: 'TIP Quezon City',
    bio: 'Tech Club admin. Build nights, hackathons and career tips.',
    interests: ['Programming', 'Hackathons', 'Open source'], boards: 5, events: 12, posts: 63,
  },
};

export const personOf = (id: string): Person | undefined => PEOPLE[id];

/* ---------- Chat threads (kept in memory for this session) ---------- */
export interface ChatMsg { id: string; mine: boolean; text: string; at: number }
const ago = (mins: number) => Date.now() - mins * 60000;

const THREADS: Record<string, ChatMsg[]> = {
  angela: [
    { id: 'a1', mine: false, text: 'Hi Juan! Do you still have the Calculus 2 review sheets?', at: ago(25) },
  ],
  carlo: [
    { id: 'c1', mine: false, text: 'Valorant scrims moved to 5 PM this Wednesday. Same lab, bring your own headset.', at: ago(60 * 24 * 4 + 12) },
    { id: 'c2', mine: true, text: 'Got it, thanks Carlo! See you there.', at: ago(60 * 24 * 4) },
  ],
};
const chatListeners = new Set<() => void>();

export const getThread = (personId: string): ChatMsg[] => THREADS[personId] ?? [];
// Messages are saved on this device. They load once at startup, and sending waits for that so nothing is overwritten.
const CHAT_KEY = 'vicinia_chat';
const chatReady = loadJSON<Record<string, ChatMsg[]>>(CHAT_KEY, {}).then((saved) => {
  Object.keys(saved ?? {}).forEach((id) => { if (Array.isArray(saved[id])) THREADS[id] = saved[id]; });
  chatListeners.forEach((l) => l());
});
export const sendMessage = (personId: string, text: string) => {
  const t = text.trim();
  if (!t) return;
  chatReady.then(() => {
    THREADS[personId] = [...getThread(personId), { id: `m${Date.now()}`, mine: true, text: t, at: Date.now() }];
    chatListeners.forEach((l) => l());
    saveJSON(CHAT_KEY, THREADS);
  });
};
export const subscribeChat = (l: () => void) => {
  chatListeners.add(l);
  return () => { chatListeners.delete(l); };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const clockLabel = (ts: number) => {
  const d = new Date(ts);
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return new Date().toDateString() === d.toDateString() ? time : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${time}`;
};
