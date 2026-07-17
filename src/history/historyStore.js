// Storage-agnostic history seam used by the UI.
//
// Phase 1 delegates entirely to localHistory (per-browser, anonymous). This
// module is the single place a future remote store (for authenticated sessions)
// would be dispatched to based on session status — the UI depends only on this
// async interface, never on a concrete backend. Keep the signatures async so
// adding a network-backed store later is not a breaking change for callers.

import * as localHistory from './localHistory.js'

export async function saveAttempt(attempt) {
  return localHistory.saveAttempt(attempt)
}

export async function listAttempts() {
  return localHistory.listAttempts()
}
