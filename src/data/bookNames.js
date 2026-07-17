// Canonical French -> English names for every book/section in the quiz dataset.
// Single source of truth for the English question bank (data/quiz_biblique.en.json)
// and the fr/en data-parity test. Several entries are grouped pseudo-books that
// naive machine translation would mangle (Épîtres, Petits Prophètes, …) — keep
// these curated.
export const BOOK_NAMES_FR_TO_EN = {
  Genèse: 'Genesis',
  Exode: 'Exodus',
  Lévitique: 'Leviticus',
  Nombres: 'Numbers',
  Deutéronome: 'Deuteronomy',
  Josué: 'Joshua',
  Juges: 'Judges',
  Ruth: 'Ruth',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Rois': '1 Kings',
  '2 Rois': '2 Kings',
  '1-2 Chroniques': '1–2 Chronicles',
  'Esdras-Néhémie': 'Ezra–Nehemiah',
  Esther: 'Esther',
  Job: 'Job',
  Psaumes: 'Psalms',
  Proverbes: 'Proverbs',
  Ecclésiaste: 'Ecclesiastes',
  'Cantique des Cantiques': 'Song of Songs',
  Ésaïe: 'Isaiah',
  Jérémie: 'Jeremiah',
  Ézéchiel: 'Ezekiel',
  Daniel: 'Daniel',
  'Petits Prophètes': 'Minor Prophets',
  Matthieu: 'Matthew',
  Marc: 'Mark',
  Luc: 'Luke',
  Jean: 'John',
  'Actes des Apôtres': 'Acts',
  Épîtres: 'Epistles',
  Apocalypse: 'Revelation',
}
