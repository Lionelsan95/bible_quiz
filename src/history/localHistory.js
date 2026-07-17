// Local, per-browser quiz history backed by localStorage.
//
// Pure functions, no React. The storage key is versioned so a future change to
// the record shape can migrate (or ignore) old data instead of crashing on it.
// All access is wrapped in try/catch because localStorage can throw in private
// browsing or when the quota is exceeded — history is best-effort and must never
// break the quiz flow.

const STORAGE_KEY = 'quiz-biblique.attempts.v1'

// Bound storage growth. Only the most recent attempts are kept.
const MAX_ATTEMPTS = 100

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `attempt_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// localStorage is user-editable and shared across app versions, so individual
// records may be malformed even when the container parses. Validate each one so
// consumers can trust the shape (see the `.v1` key rationale above).
function isValidAttempt(a) {
  return (
    a !== null &&
    typeof a === 'object' &&
    typeof a.id === 'string' &&
    typeof a.livre === 'string' &&
    typeof a.score === 'number' &&
    typeof a.total === 'number'
  )
}

// Reads the stored array, tolerating absent/corrupt data by returning [].
function readAll() {
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
// filled in so callers can pass just { livre, score, total }.
export function saveAttempt(attempt) {
  const record = {
    id: attempt.id ?? newId(),
    livre: attempt.livre,
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
