# Ihsan — TODO v2: Fix, Harden, Then Build

> Generated 2026-09-05 from a full codebase audit against
> `ihsan-feature-audit-2026.md`. Organised into three tiers:
>
> - **Phase 0** — Fix what we started but didn't finish properly
> - **Phase 1** — Harden foundations before adding surface area
> - **Phase 2** — New features from the audit roadmap
>
> Each item is tagged: `[S]` ≤2 days, `[M]` 3–7 days, `[L]` 2–4 weeks

---

## Phase 0 — Fix & Complete Existing Features

> Things that are built but have gaps, edge cases, or correctness issues.
> These should be resolved before any new feature work.

### 0.1 Zikr Counter — Tab-Close Data Loss

- [x] **Add `beforeunload` + `visibilitychange` flush** (2026-09-05: `pagehide` + `visibilitychange`(hidden) listeners in `App.tsx` call `flush({ keepalive: true })`, which reads the cached Firebase token synchronously (no async `getIdToken()` round-trip that could get cut off) and issues `fetch(..., { keepalive: true })` so the request survives unload — `sendBeacon` wasn't viable since it can't carry the Bearer auth header. Also added `flushZikrLocalPersistence()` to force the debounced localStorage write through immediately before teardown. Verified in-browser: simulated `visibilitychange`→hidden correctly triggered the batch POST.)
- [x] **Persist `lifetimeTotals` in the store's `partialize` config** (2026-09-05: added to the persisted fields in `useZikrStore.ts` — `hydrate()` still overwrites it with the server value on success, so this only improves the offline/slow-network fallback.)
- [ ] `[S]` **Cross-device type deletion propagation** — type list merge is additive-only (union via `Set`). If a user deletes a type on device A, device B re-adds it on hydration. Add a `deletedTypes[]` array synced to the server, or make the server's type list authoritative with soft-delete timestamps.

### 0.2 Salat Tracker — Offline & Auto-Miss Gaps

- [x] **Offline queueing for salat status changes** (2026-09-05: new `frontend/src/utils/salatOutbox.ts` — a localStorage-backed queue keyed by `(kind, date, prayer)` so repeated taps on the same field replace rather than stack. `useUpdatePrayer`/`useUpdateNafl` in `useSalatLog.ts` now catch network errors specifically — `axios.isAxiosError(err) && !err.response` — and enqueue instead of rolling back the optimistic UI (a real 4xx/5xx still rolls back as before). Replay runs on `window.addEventListener('online', …)` in `App.tsx` and once on mount if already online, both reusing the same handler that flushes the zikr queue. Verified: dedup/enqueue/remove logic exercised directly in-browser via the dev server's raw ES module import.)
- [x] ~~**Backend auto-miss for unvisited days**~~ — investigated, not actually a gap: `getSalatAnalytics` already treats any past day with no `SalatLog` row as "5 missed" on every read (`backend/src/services/salat.service.ts:267-274`), the frontend independently displays past-pending as "missed" (`SalatTracker.tsx`'s `displayStatus` derivation), and `ensureCaughtUp` accrues kaza debt for such days regardless of whether a row exists. All three consumers derive "missed" consistently without needing a physical DB write — writing backdated rows would be redundant and contradicts the codebase's documented lazy-expiry design (`getLogReadOnly`'s own comment). No change made.

### 0.3 Fasting Tracker — Kaffarah Enforcement

- [x] **Kaffarah 60-day consecutive enforcement** — investigated first: the break/restart logic was _already_ correctly implemented (`currentRun`/`runStale` in `getSummary`, with a "chain broken" warning banner in `FastingTracker.tsx`). What was genuinely missing: no awareness of ḥayḍ/nifās. A woman's period during her kaffarah run was treated as an ordinary gap and would incorrectly reset her count to 0, even though the majority fiqh position is that a mandatory Sharīʿah-imposed break doesn't restart consecutiveness. Fixed in `backend/src/services/fasting.service.ts`: the run-walk now calls `cycle.service.ts`'s existing `getExcusedIntervals(userId)` and treats any day inside a logged hayd/nifas episode as transparent to the count — neither breaking nor extending it — while an ordinary (non-excused) gap still resets it. Added two new assertions to `backend/tests/fasting.e2e.test.js` proving both halves (hayd bridges the gap; a plain gap still breaks it). Full backend suite (82 tests, 9 suites) passes.
- [x] ~~**Auto-detect Ramadan from Hijri date**~~ — investigated, not a gap: `frontend/src/utils/ramadan.ts`'s `getRamadanWindow()` already fully derives Ramadan state from the Hijri calendar (via `getHijriDate`), and `RamadanTracker.tsx` gates its entire UI on `window_.active` — no manual toggle exists. No change made.

### 0.4 Streaks — Dual System & Hardcoded Grace

- [x] **Resolve dual streak system** — investigated: `streak.service.ts` already documents (and correctly implements) that `ZikrStreak.currentStreak`/`lastCompletedDate` is NOT a live counter, only a "credit anchor" written exclusively by pause/resume — the real streak is always derived fresh from `ZikrDaily`. The actual dual-implementation risk was dead code: the model (`ZikrStreak.ts`) still carried `updateStreak()`/`pause()`/`resume()` instance methods from an older live-counter design, never called anywhere (confirmed via repo-wide grep) since `streak.service.ts` reimplements pause/resume directly on document fields. Removed the three orphaned methods and their interface entries, keeping the schema fields (still genuinely used as the anchor). No behavior change — pure dead-code removal to eliminate the exact confusion the audit flagged.
- [x] **Make grace days configurable** (2026-09-05: added `graceDays` (0-3, default 1) to `ZikrGoal`, threaded through `setGoal`/`getGoal`, the `/api/analytics/goal` endpoint + validation, and `getStreakStatus`'s grace-window check (`misses > graceDays` replacing the hardcoded `misses >= 2`). Also rewrote `classifyDays` — the heatmap tagger — from a single-day neighbor check to proper run-length classification, since the old per-day lookahead had no way to mark a 2+ day gap as "grace" even conceptually; found and fixed an ordering bug in the rewrite (today being met was checked after the "today/future → pending" branch, so a completed today showed as pending) before it shipped. Added a `graceDays` selector to the goal-setting modal in `ZikrAnalytics.tsx` with new i18n keys in both `en`/`bn`. New `backend/tests/streak.unit.test.js` seeds `ZikrDaily`/`ZikrGoal` directly to test the multi-day-gap cases end-to-end at the service level, since the HTTP backfill endpoint caps manual repairs at 2 days back regardless of `graceDays` (documented as a known, low-priority limitation in `zikr.schemas.ts` rather than plumbing a DB lookup into request validation for it). Full backend suite (86 tests, 10 suites) passes. UI verified via typecheck + build + confirming `select select-bordered` is an already-proven DaisyUI pattern (used identically in `SalatSettings.tsx`) — did not attempt a live browser walkthrough since the local backend points at the production MongoDB Atlas cluster with no dev-auth bypass configured, and faking a session to reach this modal would mean firing real mutations against production data.

### 0.5 Quran — Dual Recording & Offline Reading

- [x] **Consolidate page-based vs ayah-based recording** — investigated: the "dual recording" was already correctly unified server-side. `unitsOf()` in `quran.service.ts` converts both `pages` and `ayat` into one ayat-equivalent measure (`ayat + pages·10`), and every analytics computation (streak, goal, pace, khatm ETA) already goes through it — this was never actually inconsistent. What genuinely needed cleanup: `useLogReading()`, the frontend hook for the legacy page-based path, had zero call sites anywhere in the app (confirmed via repo-wide grep) — the v4 ayah engine (`useReadAyat`) is the only path any component actually calls. Removed the dead hook and its now-unused `QURAN_TOTAL_PAGES` export from `useQuran.ts`. Left the backend `addReading`/`/api/quran/read` alone (still has real test coverage, still valid for historical-data continuity) but added a doc comment on `addReading` marking it explicitly legacy/back-compat-only so the next reader isn't confused about which path is canonical.
- [x] **Offline Quran text** (2026-09-05: migrated `loadSurahList`/`loadSurahText` in `quranData.ts` from `localStorage` to IndexedDB via a new minimal `idbCache.ts` helper — this doubles as Phase 1.1's "Quran text cache → IndexedDB" item, same underlying fix. Includes a one-time migration path: an existing localStorage-cached surah is read once, moved into IndexedDB, and removed from localStorage, instead of being discarded and refetched. Note: the PWA service worker already CacheFirst-caches `api.alquran.cloud` for 30 days, so previously-read surahs were likely already available offline before this change — the real win here is relieving localStorage pressure (the actual problem the audit flagged), not newly-unlocked offline capability. Verified live in-browser: confirmed a fetched surah lands in IndexedDB (not localStorage), and confirmed the migration path returns pre-existing localStorage data, writes it to IndexedDB, and clears the old key — all without a network refetch.)

### 0.6 Friends/Noor — Missing Safety Controls

- [ ] `[M]` **Friend request/approval flow** — connecting via invite code is instant and mutual with no pending state. Add an accept/reject step so users control who sees their data.
- [ ] `[S]` **Privacy controls** — add ability to hide Noor score / go invisible on the leaderboard. Some users' fiqh position is that worship data should never be shared.
- [ ] `[S]` **Block mechanism** — no way to block another user currently.

### 0.7 Rayhanah — Garden Sync & Key Cleanup

- [ ] `[S]` **Clean up orphaned `ihsan_rayhanah_garden_*` keys** — a new localStorage key is created every day and never cleaned up. Add a cleanup pass that removes keys older than 30 days on app start.
- [ ] `[S]` **Sync Garden of Light to server** — currently device-local only. Progress is lost on device switch or cache clear. Add a simple daily-checklist endpoint.

### 0.8 Documentation Drift

- [ ] `[S]` **Fix CLAUDE.md AI provider references** — tech stack table says "OpenAI SDK v4" and env section says `OPENAI_API_KEY`, but the code uses Groq (`GROQ_API_KEY`, `api.groq.com`). Update to match reality.

### 0.9 Auth — Cross-Account State Leak on Sign-Out

> Not in the original audit — found 2026-09-05 while the user was testing sign-out/sign-in behavior manually and noticed a previous account's data flash on screen.

- [x] **Logout button called the wrong zikr reset action** (2026-09-05: `Navbar.tsx`'s sign-out handler called `useZikrStore`'s `reset()` — which only zeroes the count for whichever dhikr type happens to be currently selected — instead of `resetAll()`, the comprehensive wipe. Confirmed this was a real, visible bug via an accidental natural experiment: a check made against a not-yet-HMR-refreshed page (i.e., still running the old buggy code) showed `lifetimeTotals`, custom dhikr types, and the running total all surviving sign-out untouched; the same check after a clean reload with the fix applied showed everything correctly zeroed. Fixed by using `resetAll()` instead.)
- [x] **Debounced persistence could let a fast re-sign-in hydrate against stale data** (2026-09-05: `resetAll()` only queues a 400ms-debounced localStorage write. Added a `flushZikrLocalPersistence()` call right after it in `App.tsx`'s central `onAuthStateChanged` handler, so the cleared state is written to disk immediately — closing the window where a very fast sign-out-then-sign-in on the same device could read the outgoing account's still-on-disk blob.)
- [x] **Salat offline outbox wasn't cleared on sign-out** (2026-09-05: the `ihsan_salat_outbox` queue added in 0.2 above had no sign-out hook at all. Added `clearSalatOutbox()` and wired it into the same central sign-out handler — matches the existing precedent of wiping the React Query cache and zikr store on sign-out for shared-device safety, since an unsynced write from account A could otherwise flush into account B's session once back online.)
- [ ] `[S]` **Still to verify: whether the Google popup sign-in flow itself has a separate timing issue.** The user's original report described seeing a previous account's home page specifically during a `signInWithPopup` Google re-authentication (not a plain email/password sign-out). The fixes above address a confirmed, reproduced state-leak bug in the general sign-out path, but haven't been specifically verified against the Google-popup flow (which may also just be Google's own session-persistence silently re-authenticating the same identity — expected behavior, not a bug — if it was the same Google account both times). Re-test once confirmed whether it was the same or a different Google account.

---

## Phase 1 — Harden Foundations

> Infrastructure and hardening work that must land before major new features.

### 1.1 Storage: Migrate Heavy Data to IndexedDB

- [ ] `[M]` **Zikr pending queue → IndexedDB** — `ihsan_zikr_store`'s `pending` field can grow unboundedly while offline. The entire Zustand blob is re-serialized on every tap. Move to IndexedDB with the Zustand persist adapter (`idb-keyval` or similar). Keep small config in localStorage.
- [ ] `[M]` **React Query cache → IndexedDB** — `ihsan_rq_cache` is an unbounded cache of all API responses. The code already has a `removeOldestQuery` fallback for when localStorage fills up. Use `@tanstack/query-persist-client-core` with an IndexedDB adapter.
- [x] ~~**Quran text cache → IndexedDB**~~ — done as part of 0.5 above (same fix, same commit family).

### 1.2 AI Guardrail Policy — Enforcement Layer

> The system prompt guardrail is well-written (6 rules, no fatawa, no hadith
> generation, escalation boundary). What's missing is server-side enforcement.

- [ ] `[S]` **Output validation** — add a post-processing pass on LLM responses: regex scan for surah:ayah patterns, hadith citation patterns, ruling language (halal/haram/fard/wajib used prescriptively). Strip or replace with the static fallback if detected.
- [ ] `[S]` **Prompt injection defense** — sanitize free-text inputs (`userSummary`, `feature`, `fastType`) before interpolation. Add instruction-boundary markers. Consider a classification pre-check for the `userSummary` field.
- [ ] `[S]` **Per-user rate limiting** — current `aiLimiter` is IP-based (10/hr). Add UID-based limits (e.g., 20/day per user) like the social/import limiters already do.
- [ ] `[S]` **Lower temperature** — currently 0.8, which is high for a safety-sensitive religious domain. Drop to 0.4–0.6 to reduce hallucination risk.
- [ ] `[S]` **Audit logging** — log prompt/response pairs (or at minimum, feature + userId + timestamp + success/fallback) for review. Currently successful calls produce zero log entries.
- [ ] `[S]` **Document the policy** — write a standalone guardrail policy doc (in `.claude/` or `/docs/`) covering: no fatawa, retrieval-only for religious text, escalation boundaries, mental health boundary, cost controls. Currently exists only as inline code.
- [ ] `[S]` **Mental health escalation** — detect distress signals in streak coaching responses and surface real resources rather than generic encouragement.

### 1.3 i18n — Remaining Gaps

> The audit doc's claim that auth/AI/DaifExplainer aren't wired to i18n is
> outdated — all three areas ARE wired now. The real remaining gaps:

- [ ] `[S]` **SEO metadata i18n** — 10 pages pass hardcoded English strings to the `<Seo>` component (title, description, OG tags). Wire through `t()` so Bengali (and future Arabic) users get localised meta tags. Files: About, Landing, Feedback, FastingTracker, Privacy, NotFound, QiblaCompass, PrayerTimes, SalatTracker, ZikrCounter.
- [ ] `[S]` **ArabicKeyboard "space" label** — hardcoded English in `ArabicKeyboard.tsx` line 43. Wire through `t()`.
- [ ] `[S]` **DaifExplainer extensibility** — uses manual `claim`/`claimBn` bilingual fields instead of i18n. Works for EN/BN but won't scale to Arabic/Urdu. Refactor to use translation keys when adding a third language.

### 1.4 Auth Hardening

- [ ] `[S]` **Firebase account deletion** — data deletion exists in Settings danger zone (`DELETE /api/user/me`), but the Firebase Authentication account itself may not be deleted. Verify and add `admin.auth().deleteUser(uid)` to the purge flow.
- [ ] `[M]` **Session timeout for sensitive ops** — no forced re-authentication before dangerous operations (data deletion, account linking). Add re-auth prompt before destructive actions.

### 1.5 Analytics Performance

- [ ] `[M]` **Server-side caching for analytics aggregations** — each analytics page load runs MongoDB aggregation pipelines on raw data. For users with months of data this will degrade. Add TTL-based caching (Redis or in-memory with 15-min expiry) for heavy aggregation endpoints.

---

## Phase 2 — New Features (from Audit Roadmap)

> Ordered by the audit's 6-month phasing. Only start these after Phase 0 and
> the critical Phase 1 items (1.1, 1.2) are resolved.

### P1 — Foundations (Weeks 1–4)

- [ ] `[M]` **Sound feedback for zikr** — optional subtle wooden-bead click per count, respecting silent mode. Already flagged in TODO v1 as unbuilt.
- [ ] `[S]` **Whole-screen tap target + eyes-free haptics** — distinct haptic patterns at 33/66/99 counts. Web-capable today.
- [ ] `[L]` **Push notification system (web)** — VAPID key registration, permission priming screen, service worker push handlers, per-category opt-in toggles (adhan, streak-at-risk, adhkar windows, weekly summary). Backend: subscription store per UID+device, timezone-aware scheduler, dead-subscription reaper.
- [ ] `[S]` **Adhan audio** — optional in-browser adhan sound at prayer time. Already flagged in TODO v1.

### P2 — Daily Hooks (Weeks 5–9)

- [ ] `[M]` **Morning/evening adhkar guided sessions** — swipeable card stack for Adhkar as-Sabah wal-Masa'. Per-card: Arabic text, transliteration, translation, repetition count, source grading, optional audio. Auto-advance on reaching count. Window detection from prayer-time engine. Counts feed into zikr pipeline for Noor and streaks.
- [ ] `[M]` **Situational dua library** — Hisnul Muslim-style, searchable by situation (travel, illness, anxiety, exams, entering masjid, rain, anger). Use the existing verified-reference discipline. Also a massive SEO asset if rendered as public pages.
- [ ] `[M]` **Voice-assisted dhikr counting** — the audit endorses building this but "not the way originally described." Design a listen-and-count mode that detects repetition of a target phrase without requiring exact ASR transcription.

### P3 — Reach (Weeks 10–15)

- [ ] `[L]` **Capacitor native shell** — wrap the Vite build for App Store + Play Store. Unlocks: reliable iOS push, home-screen widgets, volume-button counting, background audio, local notification scheduling.
- [ ] `[M]` **Home-screen widgets** (post-Capacitor) — tasbih counter, next prayer, streak status.
- [ ] `[S]` **Volume-button counting** (post-Capacitor) — screen off, phone in pocket dhikr. Trivial in Capacitor.
- [ ] `[L]` **Arabic + RTL support** — `dir` attribute plumbing, migrate Tailwind `ml-`/`pl-`/`left-` to logical properties (`ms-`/`ps-`/`start-`), mirror icons/charts, test Recharts + Framer Motion under RTL. Priority: Arabic → Indonesian → Urdu → Turkish.

### P4 — Depth (Weeks 16–21)

- [ ] `[L]` **Hifz (memorisation) tracker** — _requested 2026-09-05, to build as a new tab alongside Counter/Analytics in the Quran section._
  - Per-ayah state machine: `new → learning → consolidating → solid`
  - Spaced repetition (SM-2 or FSRS) generating a daily revision queue from ayat not yet `solid`
  - Two separate daily targets: new memorisation count vs. revision count (mirrors real ḥalaqah structure)
  - Self-assessment after each recall attempt: `easy / hesitant / forgot` — drives the next review interval
  - Weak-spot heatmap across the muṣḥaf (which surahs/pages need the most revision)
  - Optional hide-the-text mode with progressive word masking, for testing recall without peeking
  - Reuses existing infrastructure: `QuranProfile`'s `readerPos`/bookmark patterns for per-ayah state storage, the streak/goal machinery already proven in zikr and quran reading
  - New backend: a `HifzEntry` model (userId, surah, ayah, state, lastReviewedAt, nextDueAt, easeFactor) + a `hifz.service.ts` with the SRS scheduling logic
  - New frontend: a `QuranHifz.tsx` page wired into `QuranTabNav` next to the existing Counter/Analytics tabs
- [ ] `[M]` **Natural-language logging** — "Prayed fajr in jamaah, read 5 pages, 100 istighfar" → parsed into structured writes across salat/quran/zikr with confirmation diff. Highest-ROI AI feature.
- [ ] `[M]` **Weekly muhasabah report** — AI-written weekly self-accounting: improvements, slips, one suggestion, one relevant ayah/hadith **retrieved from verified corpus** (never generated). Framed as reflection, never judgement.
- [ ] `[M]` **Rayhanah hardening** — PIN/biometric lock on the section, field-level encryption at rest for cycle documents, discreet mode (neutral icon/label in nav), pregnancy & nifas mode, plain-language privacy statement.

### P5 — Growth (Weeks 22–26)

- [ ] `[L]` **Programmatic SEO** — statically generate `/prayer-times/{city}` (5000+ cities), `/ramadan-calendar/{city}/{year}`, `/qibla/{city}`, `/duas/{situation}`, `/adhkar/morning|evening`, `/hijri-date-converter`, `/zakat-calculator`. Pre-render at build with Vite SSG, `hreflang` for en/bn/ar, sitemap index, Schema.org markup.
- [ ] `[M]` **Zakat calculator** — nisab by gold/silver standard, live metal prices (daily cache), asset categories, Hijri hawl anniversary tracking, madhab differences surfaced explicitly.
- [ ] `[L]` **Circles & group khatm** — family circles, group Quran khatm (30 juz divided, live progress, auto-reassignment), Ramadan challenges. Design constraint: show consistency %, never raw comparative rankings.
- [ ] `[M]` **Correlation insights** — "Your Fajr on-time rate is 71% when you log Isha before 11pm." Requires optional sleep-time logging.
- [ ] `[S]` **Khushu features** — 60-second pre-salat centring screen, auto-DND during estimated salat duration (native), post-salat adhkar auto-open.

### Backlog (No Timeline)

- [ ] **Masjid finder + crowdsourced jama'ah times** — confirm/report mechanic, staleness decay
- [ ] **Watch app** (post-Capacitor) — Apple Watch / Wear OS tasbih
- [ ] **Media Session / lock-screen controls** — count from the lock screen
- [ ] **Monetisation plumbing** — free/premium boundary, sadaqah tier, regional pricing
- [ ] **Full account data export** — JSON/ZIP download of all user data across all features
- [ ] **Global madhab setting** — currently only in CycleProfile, should be a user-level preference affecting fiqh rules across features
- [ ] **Noor score transparency** — explain the scoring formula in the UI
- [ ] **Friend activity feed** — beyond the leaderboard, show what friends are doing (aggregates only, never specific acts)

---

## Anti-Features (Never Build)

| Item                               | Why                                               |
| ---------------------------------- | ------------------------------------------------- |
| Global public leaderboards         | Riya' — showing off voids the act                 |
| AI that answers fiqh questions     | Liability, genuinely harmful if wrong             |
| Any ad network                     | Serves haram creatives, destroys privacy position |
| Location-data monetisation         | Trust is Ihsan's moat (see audit §5.1)            |
| Guilt-based streak mechanics       | Wrong theology, churns users                      |
| Charging for core worship tracking | Basic ibadah tracking free forever                |
| Facebook/Meta login                | Already decided, correct                          |
| Unbounded auto-play                | Must default to a bounded cap (see memory)        |
