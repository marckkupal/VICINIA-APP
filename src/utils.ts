export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const norm = (s: string) => s.trim().toLowerCase();
export const initials = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
export const fmtCount = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));

export const PASSWORD_RULE = 'At least 8 characters, uppercase and lowercase letters, and a number.';
export const isStrongPassword = (pw: string) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw);
export const campusLabel = (university: string) =>
  /technological institute of the philippines/i.test(university)
    ? /manila/i.test(university) ? 'TIP Manila' : 'TIP Quezon City'
    : university;

// true  = Save Changes only previews the result; the original profile details stay unchanged.
// false = Save Changes really updates the profile stored on this device.
export const DEMO_PROFILE_SAVE = false;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// The next `count` weekdays (Mon–Fri), starting tomorrow, e.g. "October 20, 2026".
export const nextWeekdays = (count = 5): string[] => {
  const out: string[] = [];
  const d = new Date();
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(`${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
  }
  return out;
};
// Short reference shown on confirmation screens, e.g. "OSA-3K9F2A".
export const makeRef = (prefix: string) => `${prefix}-${Math.floor(Math.random() * 0xffffff).toString(36).toUpperCase().padStart(5, '0')}`;
