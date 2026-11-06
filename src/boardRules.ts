// Rules for creating a board. Kept free of React so the same checks run in the form and again inside the store.
export const BOARD_NAME_MIN = 3;
export const BOARD_NAME_MAX = 40;
export const BOARD_DESC_MIN = 10;
export const BOARD_DESC_MAX = 200;

// Plain character ranges (Latin letters with accents, digits) instead of \p{L}, which not every JS engine supports.
const NAME_CHARS = /^[A-Za-z0-9\u00C0-\u024F][A-Za-z0-9\u00C0-\u024F &'’.,!\-_]*$/;

export const cleanName = (s: string) => s.replace(/\s+/g, ' ').trim();
export const cleanDescription = (s: string) => s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
// Names are compared ignoring case, spacing and punctuation, so "Chess Club" and "chess  club!" are the same board.
export const nameKey = (s: string) => cleanName(s).toLowerCase().replace(/[^a-z0-9\u00e0-\u024f]/g, '');

export interface BoardFormErrors { name?: string; description?: string; category?: string }

export function validateBoard(input: { name: string; description: string; category: string }, categories: string[]): BoardFormErrors {
  const errors: BoardFormErrors = {};
  const name = cleanName(input.name);
  const desc = cleanDescription(input.description);
  if (!name) errors.name = 'Enter a board name.';
  else if (name.length < BOARD_NAME_MIN) errors.name = `Use at least ${BOARD_NAME_MIN} characters.`;
  else if (name.length > BOARD_NAME_MAX) errors.name = `Keep it under ${BOARD_NAME_MAX} characters.`;
  else if (!NAME_CHARS.test(name) || !nameKey(name)) errors.name = 'Use letters and numbers. Start with a letter or number.';
  if (!desc) errors.description = 'Tell people what this board is about.';
  else if (desc.length < BOARD_DESC_MIN) errors.description = `Add a little more detail (at least ${BOARD_DESC_MIN} characters).`;
  else if (desc.length > BOARD_DESC_MAX) errors.description = `Keep it under ${BOARD_DESC_MAX} characters.`;
  if (!categories.includes(input.category)) errors.category = 'Pick a category.';
  return errors;
}
