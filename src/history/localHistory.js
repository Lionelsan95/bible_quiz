// Local, per-browser quiz history backed by localStorage.
//
// Pure functions, no React. The storage key is versioned so a change to the
// record shape can migrate (or ignore) old data instead of crashing on it.
// All access is wrapped in try/catch because localStorage can throw in private
// browsing or when the quota is exceeded — history is best-effort and must never
// break the quiz flow.

const STORAGE_KEY = 'quiz-biblique.attempts.v2'

// v1 stored the book under the French key `livre`; kept only for migration.
const LEGACY_KEY_V1 = 'quiz-biblique.attempts.v1'

// Bound storage growth. Only the most recent attempts are kept.
const MAX_ATTEMPTS = 100

function newId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `attempt_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// localStorage is user-editable and shared across app versions, so individual
// records may be malformed even when the container parses. Validate each one so
// consumers can trust the shape (see the versioned-key rationale above).
function isValidAttempt(a) {
  return (
    a !== null &&
    typeof a === 'object' &&
    typeof a.id === 'string' &&
    typeof a.book === 'string' &&
    typeof a.score === 'number' &&
    typeof a.total === 'number'
  )
}

// v1 records used `livre` instead of `book`; validate them in their old shape
// before migrating.
function isValidV1Attempt(a) {
  return (
    a !== null &&
    typeof a === 'object' &&
    typeof a.id === 'string' &&
    typeof a.livre === 'string' &&
    typeof a.score === 'number' &&
    typeof a.total === 'number'
  )
}

// One-time, idempotent migration: if no v2 store exists yet, carry forward any
// valid v1 records, mapping the old `livre` key to `book`. The v1 store is left
// in place (rollback safety) — an old tab running old code keeps working, and
// its writes are simply ignored by this newer code. Runs lazily on every read
// but short-circuits after the first migration (one getItem when v2 exists).
function migrateV1() {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== null) return
    const raw = localStorage.getItem(LEGACY_KEY_V1)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    // v1 stored newest-first (its saveAttempt prepended new records), so slicing
    // keeps the most recent attempts — matching v2's cap semantics.
    const migrated = parsed
      .filter(isValidV1Attempt)
      .map((a) => ({
        id: a.id,
        book: a.livre,
        score: a.score,
        total: a.total,
        completedAt: a.completedAt,
      }))
      .slice(0, MAX_ATTEMPTS)
    // Write v2 even when `migrated` is empty: the v1 key was present and parsed,
    // so this marks migration done and stops re-parsing v1 on every later read.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
  } catch {
    // Storage unavailable / corrupt — skip migration, best-effort.
  }
}

// Reads the stored array, tolerating absent/corrupt data by returning [].
function readAll() {
  migrateV1()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isValidAttempt) : []
  } catch {
    return []
  }
}

// Appends an attempt and returns the stored record (newest-first ordering is
// maintained here so consumers don't have to sort). Missing id/completedAt are
// filled in so callers can pass just { book, score, total }.
export function saveAttempt(attempt) {
  const record = {
    id: attempt.id ?? newId(),
    book: attempt.book,
    score: attempt.score,
    total: attempt.total,
    completedAt: attempt.completedAt ?? new Date().toISOString(),
  }
  try {
    const next = [record, ...readAll()].slice(0, MAX_ATTEMPTS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable (private mode / quota) — silently skip persistence.
  }
  return record
}

// Returns all stored attempts, most recent first.
export function listAttempts() {
  return readAll()
}
