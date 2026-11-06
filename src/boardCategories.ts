import { BOARD_DETAILS } from './boardData';
import type { Board } from './types';

// One place that defines what a board category looks like. Every board, built-in or created by a student,
// gets the same identity badge: its category's icon on the category's color. No photos, nothing random.
export interface BoardCategory { label: string; emoji: string; tint: string; accent: string }

export const BOARD_CATEGORIES: BoardCategory[] = [
  { label: 'Academics', emoji: '📚', tint: '#FFF8E1', accent: '#E0A800' },
  { label: 'Technology', emoji: '💻', tint: '#E4F1EA', accent: '#3C9A5F' },
  { label: 'Gaming', emoji: '🎮', tint: '#EDE8F6', accent: '#7B5CC4' },
  { label: 'Anime', emoji: '🎌', tint: '#F8E9E5', accent: '#D9534F' },
  { label: 'Music', emoji: '🎧', tint: '#E6EBFB', accent: '#3D5FC4' },
  { label: 'Photography', emoji: '📷', tint: '#FDF1C4', accent: '#C99A12' },
  { label: 'Sports', emoji: '🏀', tint: '#E8F3EA', accent: '#2F8A55' },
  { label: 'Arts & Culture', emoji: '🎨', tint: '#F3E8F4', accent: '#A04FA8' },
  { label: 'Campus Events', emoji: '🎪', tint: '#F5EAE6', accent: '#E8714A' },
  { label: 'Wellness', emoji: '🌿', tint: '#E3F0E4', accent: '#3C9A5F' },
  { label: 'TIP Community', emoji: '🏫', tint: '#FDF1C4', accent: '#1F1F1F' },
  { label: 'Student Orgs', emoji: '🤝', tint: '#E6EDFB', accent: '#3D5FC4' },
  { label: 'College Events', emoji: '🗓️', tint: '#F5EAE6', accent: '#E8714A' },
  { label: 'Other', emoji: '💬', tint: '#F3F1EA', accent: '#7A776E' },
];

const OTHER = BOARD_CATEGORIES[BOARD_CATEGORIES.length - 1];
export const categoryNames = BOARD_CATEGORIES.map((c) => c.label);

// Built-in boards already use their category as `label` (Anime, Gaming, Technology ...); new boards store `category`.
export const categoryOf = (b: Pick<Board, 'category' | 'label'>): string => b.category ?? b.label ?? OTHER.label;
export const styleOf = (b: Pick<Board, 'category' | 'label'>): BoardCategory => {
  const name = categoryOf(b).toLowerCase();
  return BOARD_CATEGORIES.find((c) => c.label.toLowerCase() === name) ?? OTHER;
};

// The one-line blurb shown on cards and in search: the creator's description, else the built-in board's description, else its tagline.
export const blurbOf = (b: Board): string => b.description ?? BOARD_DETAILS[b.id]?.description ?? b.tagline ?? '';
