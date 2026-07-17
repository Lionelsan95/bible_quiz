import { useSyncExternalStore } from 'react'

// Theme preference store. Mirrors the persisted-preference shape of
// src/i18n/index.js. The preference is 'light' | 'dark' | 'auto' (auto follows
// the OS). Only the RESOLVED value ('light' | 'dark') is written to
// document.documentElement[data-theme]; CSS keys off [data-theme='dark'].
//
// NOTE: THEME_STORAGE_KEY is duplicated in index.html (the pre-paint FOUC guard)
// and in the test setup. Keep all three in sync.

export const THEMES = ['light', 'dark', 'auto']
export const DEFAULT_THEME = 'auto'
const THEME_STORAGE_KEY = 'quiz-biblique.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

// jsdom (and any non-DOM env) lacks matchMedia — guard it everywhere.
function darkMediaQuery() {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return null
  }
  return window.matchMedia(DARK_QUERY)
}

export function getSystemTheme() {
  const mq = darkMediaQuery()
  return mq && mq.matches ? 'dark' : 'light'
}

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return THEMES.includes(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function resolveTheme(pref) {
  return pref === 'auto' ? getSystemTheme() : pref
}

function writeDataTheme(resolved) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved)
  }
}

// --- reactive store ---------------------------------------------------------

let currentPref = getStoredTheme()
// Cached snapshot: useSyncExternalStore requires getSnapshot to return a stable
// reference between changes, so we replace this object only inside notify().
let snapshot = { theme: currentPref, resolvedTheme: resolveTheme(currentPref) }
const listeners = new Set()

function notify() {
  snapshot = { theme: currentPref, resolvedTheme: resolveTheme(currentPref) }
  for (const cb of listeners) cb()
}

// Applies the resolved theme to the DOM. Does NOT persist and does NOT update
// the store — a low-level primitive used only by init and the OS-change handler.
// Prefer setTheme() from UI code so the DOM and useTheme() consumers stay in sync.
export function applyTheme(pref) {
  writeDataTheme(resolveTheme(pref))
}

export function getTheme() {
  return currentPref
}

export function setTheme(pref) {
  if (!THEMES.includes(pref) || pref === currentPref) return
  currentPref = pref
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref)
  } catch {
    // Storage unavailable (private mode) — preference still applies this session.
  }
  applyTheme(pref)
  notify()
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return snapshot
}

export function useTheme() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { theme: snap.theme, resolvedTheme: snap.resolvedTheme, setTheme }
}

// --- init -------------------------------------------------------------------

// Apply the stored preference (idempotent with the index.html pre-paint guard).
applyTheme(currentPref)

// When the OS scheme changes, re-apply only if the user is on 'auto'.
const mq = darkMediaQuery()
if (mq) {
  const onSystemChange = () => {
    if (currentPref === 'auto') {
      applyTheme('auto')
      notify()
    }
  }
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onSystemChange)
  } else if (typeof mq.addListener === 'function') {
    mq.addListener(onSystemChange) // legacy Safari
  }
}
