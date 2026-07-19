---
name: sessions-accounts-architecture
description: Decisions for the sessions/user-accounts feature (2026-07-17 plan) — Supabase BaaS, storage abstraction, phased rollout, anonymous-first
metadata:
  type: project
---

Architectural decisions for the "sessions / accounts / quiz history" feature, made 2026-07-17 (plan stage, not yet implemented — verify against code before relying on these):

- **Backend**: Supabase (BaaS) chosen over a custom Node backend or pure localStorage. Reason: app stays a static Vite build (no server to host/operate), Supabase provides auth + Postgres + RLS on free tier; a custom backend would make the team own password hashing/session security for a hobby-scale app.
- **Anonymous-first invariant**: anonymous users never touch the network. Anonymous history lives in `localStorage` only; no Supabase anonymous sign-in (that would require network on the zero-friction path). App must build/run/test with no Supabase env vars configured.
- **Storage abstraction**: single `historyStore` interface (`saveAttempt`, `listAttempts`) with two implementations — localStorage-backed and Supabase-backed. UI never imports Supabase directly except via `src/lib/supabaseClient.js`.
- **Session state**: React context (`SessionProvider` + `useSession`) wrapping App in `main.jsx`. Quiz-flow state (screen/book/questions/score) deliberately stays as `useState` in App.jsx — do NOT move it into context.
- **Navigation**: extend the existing `SCREENS` constant in App.jsx (add HISTORY, AUTH) rather than introducing a router. No react-router.
- **Data model**: `quiz_attempts` table (user_id, livre text, score int, total int, completed_at timestamptz, details jsonb optional) with RLS insert/select-own-rows. Local attempts mirror this shape under key `quiz-biblique.attempts.v1`. NOTE (2026-07-17): the i18n plan ([[i18n-english-flip-plan]]) renames `livre`→`book` and bumps the local key to `.v2` — use those names when this feature is built.
- **Account upgrade path**: on first sign-in, offer one-time import of local attempts into the account.
- **Phases**: (1) local history for everyone, no backend; (2) Supabase auth; (3) remote history + local import; (4) optional per-question detail/stats. Each phase ships independently; anonymous flow untouched throughout.

**Why:** goal required optional accounts without breaking the zero-friction anonymous path; the app was 100% static with no fetching.
**How to apply:** future work on auth/history should follow these seams (historyStore interface, SessionProvider, SCREENS extension) instead of inventing new ones. See [[user-profile]] if written.
