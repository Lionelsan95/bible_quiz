// jsdom does not implement window.matchMedia. This installs a controllable stub
// so the theme module (src/theme/theme.js) can resolve the OS colour-scheme and
// tests can simulate the user flipping their system between light and dark.

let systemDark = false
const listeners = new Set()

export function installMatchMedia() {
  systemDark = false
  listeners.clear()
  window.matchMedia = (query) => ({
    media: query,
    // Only the dark-scheme query is meaningful to the app.
    get matches() {
      return query.includes('dark') ? systemDark : false
    },
    addEventListener: (_type, cb) => listeners.add(cb),
    removeEventListener: (_type, cb) => listeners.delete(cb),
    addListener: (cb) => listeners.add(cb), // legacy Safari
    removeListener: (cb) => listeners.delete(cb), // legacy Safari
    dispatchEvent: () => true,
    onchange: null,
  })
}

// Simulate the OS switching scheme: flips `matches` and fires every listener
// registered via the stub (both addEventListener and legacy addListener).
export function setSystemColorScheme(dark) {
  systemDark = dark
  const event = { matches: dark, media: '(prefers-color-scheme: dark)' }
  for (const cb of [...listeners]) cb(event)
}

// Clears registered listeners + state. Use before a vi.resetModules() + fresh
// import of the theme module so a stale module's listener can't also react.
export function resetMatchMedia() {
  systemDark = false
  listeners.clear()
}
