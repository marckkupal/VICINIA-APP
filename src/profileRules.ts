import { PROGRAMS, YEARS, programCode } from './data';
import type { User } from './types';
import { isValidName } from './utils';

// Rules for the Edit Profile form. Pure functions, so the form and the tests use the same checks.
export type ProfileErrors = Partial<Record<'name' | 'university' | 'program' | 'year', string>>;

export const NAME_MAX = 60;
export const UNIVERSITY_MAX = 100;
// A picked photo is kept on the account as a small data link; anything bigger than this is refused (Firestore documents are limited to 1 MB).
export const AVATAR_MAX_CHARS = 300_000;

export function validateProfile(d: Pick<User, 'name' | 'university' | 'program' | 'year'>): ProfileErrors {
  const e: ProfileErrors = {};
  const name = d.name.trim();
  if (!name) e.name = 'Full name is required.';
  else if (!isValidName(name)) e.name = 'Use letters only (spaces, hyphens, apostrophes and periods are fine). No numbers or symbols.';
  else if (name.length > NAME_MAX) e.name = `Keep your name under ${NAME_MAX} characters.`;

  const uni = d.university.trim();
  if (!uni) e.university = 'University is required.';
  else if (uni.length > UNIVERSITY_MAX) e.university = `Keep this under ${UNIVERSITY_MAX} characters.`;

  if (!PROGRAMS.some((p) => p.code === programCode(d.program.trim()))) e.program = 'Select your program.';
  if (!(YEARS as readonly string[]).includes(d.year)) e.year = 'Select your year.';
  return e;
}

// The form as it would be saved (trimmed, program as its code).
export const normalizeProfile = (d: User): User => ({ ...d, name: d.name.trim(), university: d.university.trim(), program: programCode(d.program.trim()) });

// True when saving would change something. Email is not editable, so it is not compared.
export const profileChanged = (a: User, b: User): boolean => {
  const x = normalizeProfile(a);
  const y = normalizeProfile(b);
  return x.name !== y.name || x.university !== y.university || x.program !== y.program || x.year !== y.year || (x.avatarUri || '') !== (y.avatarUri || '');
};

// What to send for the photo: undefined = leave it alone, '' = remove it, or the new photo.
// Only a photo picked on this device (a data: link) is uploaded. A web address (e.g. the Google profile picture) is never copied to the account.
export const avatarChange = (before?: string, after?: string): string | undefined => {
  if ((after || '') === (before || '')) return undefined;
  if (!after) return '';
  return after.startsWith('data:') ? after : undefined;
};
