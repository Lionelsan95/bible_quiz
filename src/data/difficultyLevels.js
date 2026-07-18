// Canonical difficulty levels (increasing order), the single list the UI
// iterates over. Raw per-language difficulty values are canonicalized to one
// of these by questions.js's normalizers — mirrors bookNames.js's role for
// `book`, except levels canonicalize to ONE shared vocabulary for both
// languages (English display names are handled entirely via i18n, not via a
// per-book display string).
export const LEVELS = ['easy', 'medium', 'hard']

// Raw French `difficulte` -> canonical level id.
export const DIFFICULTY_FR_TO_LEVEL = {
  facile: 'easy',
  moyen: 'medium',
  difficile: 'hard',
}

// Raw English `difficulty` values already match the canonical ids. Kept as an
// explicit identity map (rather than passing the raw value through) so both
// banks go through the same canonicalization + fallback path in questions.js,
// and so this map can be reused symmetrically by the fr/en parity test.
export const DIFFICULTY_EN_TO_LEVEL = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
}
