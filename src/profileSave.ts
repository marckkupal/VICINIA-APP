import { friendlyAuthError, updateProfile } from './auth';
import { avatarChange, normalizeProfile, profileChanged, validateProfile } from './profileRules';
import type { ProfileErrors } from './profileRules';
import type { User } from './types';

// What happened when the person pressed Save. The screen shows feedback straight from this, so success is reported
// only when `ok` is true, which is only after the account confirmed the write (updateProfile rejects on network failure,
// a non-2xx reply, or a write the server did not store).
export type SaveOutcome =
  | { ok: true; saved: User }
  | { ok: false; kind: 'invalid'; errors: ProfileErrors }   // nothing was sent
  | { ok: false; kind: 'unchanged' }                          // nothing to save
  | { ok: false; kind: 'failed'; message: string };           // sent, but not saved: the form keeps the person's edits

export async function submitProfile(draft: User, base: User, onSaved: (u: User) => void | Promise<void>): Promise<SaveOutcome> {
  const errors = validateProfile(draft);
  if (Object.keys(errors).length) return { ok: false, kind: 'invalid', errors };
  if (!profileChanged(draft, base)) return { ok: false, kind: 'unchanged' };
  const next = normalizeProfile(draft);
  try {
    await updateProfile({
      name: next.name, university: next.university, program: next.program, year: next.year,
      avatar: avatarChange(base.avatarUri, next.avatarUri),
    });
  } catch (e) {
    return { ok: false, kind: 'failed', message: friendlyAuthError(e) };
  }
  await onSaved(next); // the app takes over only after the account has the change
  return { ok: true, saved: next };
}
