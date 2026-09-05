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

## Phase 0 — Fix & Complete Existing Features ✅ (2026-09-06)

> Things that are built but have gaps, edge cases, or correctness issues.
> These should be resolved before any new feature work.
>
> **Status: complete**, except one open sub-item (0.9's Google-popup timing question, pending user confirmation of same-vs-different account) and 0.1's cross-device type deletion propagation (deferred as low-priority — see the item). Everything else in 0.1–0.10 is shipped, tested, and pushed to `main` as of v5.6.0.

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

- [x] **Friend request/approval flow** (2026-09-05: connecting via invite code now creates a `pendingIncoming`/`pendingOutgoing` request pair on `SocialProfile` instead of instant mutual friendship; `acceptRequest`/`rejectRequest` promote or clear it. If both people happen to open each other's links, the second call auto-accepts the first's request instead of creating a redundant reverse one. New endpoints: `GET /api/social/requests`, `POST /api/social/requests/:uid/accept|reject`. Frontend: a `PendingRequestsModal` plus a gold notification banner on the Friends page shown whenever `pendingCount > 0`, independent of whether the user has any friends yet.)
- [x] **Privacy controls** (2026-09-05: added `SocialProfile.invisible` — a full opt-out where `getSummary` excludes the user from every OTHER friend's leaderboard query (`SocialProfile.find(...).select('userId invisible')` filters the friend-uid list before building stats), while the user still sees their own row and everyone else's on their own dashboard. Toggle lives in the Manage Friends modal, `PATCH /api/social/invisible`.)
- [x] **Block mechanism** (2026-09-05: `blockUser`/`unblockUser` — blocking is one-directional, immediately tears down any existing friendship or pending request in either direction, and a blocked user's future invite-code attempt gets the _same generic_ "not valid" message as a nonexistent code, so they're never tipped off they were specifically blocked. `GET /api/social/blocked` for the manage-blocked view, both wired into the Manage Friends modal with a single-step confirm for blocking, matching how deliberate that action is.)
  - Backend: full coverage in `backend/tests/social.e2e.test.js` — 13 tests (6 new: pending-request creation, reject-then-retry, accept-to-mutual, invisible hides from others but not self, block tears down + hides via generic error, unblock restores). Full suite (90 tests, 10 suites) passes.
  - Frontend: typecheck, lint, and build all pass. Live in-browser accept/reject/block/invisible click-through still pending — the credentials on file turned out to have a typo (`.mail.com` → `.gmail.com`, corrected 2026-09-06); not yet re-attempted since it's the user's real account and these actions create real social-graph artifacts (friend requests, blocks) rather than being freely reversible like a toggle.

### 0.7 Rayhanah — Garden Sync & Key Cleanup

- [x] **Clean up orphaned `ihsan_rayhanah_garden_*` keys** (2026-09-06: done as part of the server-sync migration below — every legacy key, today's and any orphaned past day's, is removed on first load once its data (if any) is migrated.)
- [x] **Sync Garden of Light to server** (2026-09-06: extended the existing `CycleDay` model with a `garden: string[]` field, exposed through the existing `PUT /api/cycle/day` endpoint rather than a new one. `RayhanahCycle.tsx` now reads/writes through `useUpsertCycleDay`'s existing optimistic-update mutation. New backend test coverage; full suite passes. Caught and fixed a real bug pre-ship: the day-upsert controller wasn't passing `garden` through to the service or including it in the response.)

### 0.8 Documentation Drift

- [x] **Fix CLAUDE.md AI provider references** (2026-09-06: updated the tech stack table and env var section to say Groq/`GROQ_API_KEY` instead of OpenAI. Local-only change — `CLAUDE.md` is gitignored.)

### 0.9 Auth — Cross-Account State Leak on Sign-Out

> Not in the original audit — found 2026-09-05 while the user was testing sign-out/sign-in behavior manually and noticed a previous account's data flash on screen.

- [x] **Logout button called the wrong zikr reset action** (2026-09-05: `Navbar.tsx`'s sign-out handler called `useZikrStore`'s `reset()` — which only zeroes the count for whichever dhikr type happens to be currently selected — instead of `resetAll()`, the comprehensive wipe. Confirmed this was a real, visible bug via an accidental natural experiment: a check made against a not-yet-HMR-refreshed page (i.e., still running the old buggy code) showed `lifetimeTotals`, custom dhikr types, and the running total all surviving sign-out untouched; the same check after a clean reload with the fix applied showed everything correctly zeroed. Fixed by using `resetAll()` instead.)
- [x] **Debounced persistence could let a fast re-sign-in hydrate against stale data** (2026-09-05: `resetAll()` only queues a 400ms-debounced localStorage write. Added a `flushZikrLocalPersistence()` call right after it in `App.tsx`'s central `onAuthStateChanged` handler, so the cleared state is written to disk immediately — closing the window where a very fast sign-out-then-sign-in on the same device could read the outgoing account's still-on-disk blob.)
- [x] **Salat offline outbox wasn't cleared on sign-out** (2026-09-05: the `ihsan_salat_outbox` queue added in 0.2 above had no sign-out hook at all. Added `clearSalatOutbox()` and wired it into the same central sign-out handler — matches the existing precedent of wiping the React Query cache and zikr store on sign-out for shared-device safety, since an unsynced write from account A could otherwise flush into account B's session once back online.)
- [ ] `[S]` **Still to verify: whether the Google popup sign-in flow itself has a separate timing issue.** The user's original report described seeing a previous account's home page specifically during a `signInWithPopup` Google re-authentication (not a plain email/password sign-out). The fixes above address a confirmed, reproduced state-leak bug in the general sign-out path, but haven't been specifically verified against the Google-popup flow (which may also just be Google's own session-persistence silently re-authenticating the same identity — expected behavior, not a bug — if it was the same Google account both times). Re-test once confirmed whether it was the same or a different Google account.

### 0.10 Additional fixes (2026-09-06, not in the original audit)

- [x] **Duplicate zikr streak/goal display in the navbar** — reported by the user: the navbar showed a second streak/goal capsule pair on `/zikr`, identical to the one already in the counter card. Removed the dead center-content branch plus the `useAnalytics` fetch and derived variables that existed only to feed it.
- [x] **Location permission required a manual reload to take effect** — reported by the user: granting location access from Home's "Set Location" button updated `localStorage` but the prayer-time widget stayed on the prompt state until reload. Root cause: `prayerWidgetData`'s `useMemo` depended only on `prayerNow.getMinutes()`, so a same-minute `setPrayerNow(new Date())` never changed the dependency. Fixed by removing Home's whole duplicate inline geolocation flow (which had this bug) and routing the button to `/prayer-times`, which already has a correct, bug-free flow (proper React state, not memo-based) — and which the user specifically asked for: seeing "Use GPS" and manual city search side by side before any permission prompt fires, rather than a native dialog triggered straight from an ambiguous button. Verified live: the Home widget now updates immediately after setting a location on `/prayer-times`, no reload; a fresh tab shows zero console errors.
- [x] **Version number in the footer** — added, read from the root `package.json` at build time via a Vite `define` (`__APP_VERSION__`) so it can't drift from the actual released version. Verified rendering live (`v5.5.0` before the bump below, confirmed baked into the built bundle).
- [x] **Version bumped to 5.6.0** with a new root `CHANGELOG.md` covering this whole release, following the project's existing (non-strict-semver) versioning convention — see the "When to bump" note added to the docs.
- [x] **Root `README.md` and `backend/README.md` reviewed** — the root README was already a thorough, well-maintained doc (not identified by the earlier audit agents, which apparently missed it); made only two small factual corrections (AI endpoint list, test count) plus a CHANGELOG link, rather than the full rewrite first attempted and then reverted. `backend/README.md` _was_ genuinely stale (an interim note from an old schema) and got a full rewrite.

### 0.11 Second bug-fix batch (2026-09-06, reported live by the user)

- [x] **`friends.prayers` showing as a raw i18n key** — a prior batch edit stripped the fallback string from `t('friends.prayers', 'prayers')` in `Friends.tsx` without ever adding the key to the locale JSON files, so the raw key rendered. Added `friends.prayers` to both `en`/`bn` locales; audited every other `friends.*` key used in the file against both locale files and found (and fixed) 4 more pre-existing gaps unrelated to that edit: `circleCount`, `circleCountPlural`, `connectedAWhileAgo`, `connectedSince`.
- [x] **Friends page mobile responsiveness** — `ManageFriendsModal`'s friend row cramped and wrapped at 375px after the Block button was added next to Remove. Fixed with `truncate` on the date text and a `shrink-0` wrapper with tighter button padding. Verified no horizontal overflow at 375px/320px.
- [x] **Gender-selection flash on every reload** — `App.tsx`'s `onAuthStateChanged` optimistic-user rebuild restored `displayName`/`photoUrl` from the cached user but never `gender` (a DB-only field, never present on Firebase's own user object), so every reload briefly rendered with `gender: undefined` and flashed the gender-gate banner even for accounts that already have a gender set. Fixed by also restoring `gender` from cache in the merge. Root cause confirmed by reading `AuthUser`'s type; fix verified live (no flash across repeated reloads).
- [x] **Profile — gender field redesign** — added an icon, a permanent "you can change this anytime" caption (removing the pressure to get it right on first sign-up — the gender gate is now clearly reversible, addressing the user's "can we make it easy" ask directly rather than adding new gating logic), and an animated pink note that appears only when Female is selected, telling the user about Rayhanah cycle tracking. No note for Male (as asked).
- [x] **Salat Tracker — Isha (and other prayers) wrongly auto-marked "missed" on days still open** — root cause: `ensureCaughtUp()` (the server-side kaza-debt rollover sweep in `salatDebt.service.ts`) was called from the `getLog`, `getHistory`, and `getDebt` controllers with no `today`, so it always fell back to the _server's_ UTC civil date as the "day is over" cutoff — completely ignoring the app's own Fajr-to-Fajr tracking-day rule (`trackingDay.ts`) and the user's timezone. In practice this meant a still-open tracking day (e.g. mid-Isha, hours before the next Fajr) could get its whole day's pending prayers swept to `'missed'` the moment the server's UTC clock ticked over — which is exactly what the user saw and had already happened to their live account (repaired below). Fixed by threading an optional `today` (the client's Fajr-tracking day, `getTrackingDay()`) through `getLog`/`getHistory`/`getDebt` into `ensureCaughtUp`, matching the pattern `getAnalytics` already used correctly; added Zod validation for the new query param and a new e2e test proving the sweep now respects an explicit `today` instead of the server clock. The "⚠️ window closed" nudge on today's still-pending prayers (a separate, display-only badge — never wrote to the DB) is unaffected for fajr/dhuhr/asr/maghrib, but for Isha specifically it now reads "⚠️ better before midnight" instead of "window closed", since Isha's window is genuinely still valid (if disliked to delay) until the next Fajr, and the old wording implied it no longer was.
- [x] **Data repair** — the live account's 2026-09-05 log (still an open tracking day) had all 5 fards wrongly marked `'missed'` by the pre-fix sweep, with a matching +5 kaza debt. Reverted via the normal `PATCH /api/salat/prayer` → `'pending'` flow (which already decrements debt on a `missed → non-missed` transition), not a raw DB edit — confirmed debt back to 0 and the tracker showing all 5 as pending/overdue, not missed.
- [x] **Zikr Counter — play/auto-play buttons hard to notice** — the per-zikr pronunciation button and the Auto-play toggle used the same muted gray styling as every other small icon button on the page, and Auto-play had no explanation of what it actually does. Gave both a distinct gold accent (idle and active states), added `whileTap` press feedback plus a pulsing ring while pronunciation is actively playing, and added a caption under the Auto-play button: "Plays the pronunciation and counts it for you, on repeat" (new `zikr.autoPlayHint` key, en+bn). Also applied the same tap feedback to the focus-mode auto-play/stop buttons for consistency. Verified live: gold styling, ping animation while playing, and the setup panel all work.
- [x] **Rayhanah — fasting-makeup card never disappeared once paid off** — confirmed the user's suspicion: the card was gated on `qadaOwed > 0` (the lifetime total ever owed), not `qadaRemaining > 0`, so it stayed on screen forever showing "0 remaining" even after every missed fast was made up. Changed the gate to `qadaRemaining > 0`. Verified against the live account's real data (4 owed / 1 made up / 3 remaining) that the card still renders correctly while debt is outstanding.
- [x] **Rayhanah competitive research** — see the new "P4.1 — Rayhanah competitive research" section below for the full findings and resulting task list.

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

### P4.1 — Rayhanah competitive research (2026-09-06, requested by the user)

> Surveyed the current crop of Muslim-women cycle-tracking apps (Nisaa, Ayda, Sila,
> flowdays, Nisa Care, Afifa, MyHayd) to see what they charge for as "premium" and
> whether any of it is missing from Rayhanah. Headline finding: **Rayhanah's fiqh
> depth already matches or beats most of them** — it already has madhab-aware hayd
> maximums, istihadha detection with a wuḍū-renewal note, a full Bukhari-sourced
> ghusl step guide, qada tracking with an auto-prompt after a Ramadan-overlapping
> cycle, and server-synced Garden of Light self-care tracking. The gaps below are
> the genuinely new ideas, not a "catch up" list.
>
> Sources: [Nisaa](https://www.getnisaa.com/) · [Ayda](https://www.aydaforme.com/) ·
> [Sila](https://mysilacycle.com/) · [flowdays](https://flowdays.co/)

- [ ] `[S]` **Full 4-madhab hayd-duration options** — Rayhanah currently offers only "Ḥanafī (3–10 days)" vs "Majority" as the max-duration setting. Nisaa and Sila both expose all four Sunni schools individually (Shafi'i: 1 day-night min, 15-day max; Maliki: no fixed minimum, personal-habit-based max; Hanbali: day-and-night min, 15-day max). Extending `CycleProfile.madhab` from a boolean-ish toggle to a proper 4-way enum is a small, self-contained change and closes the one real fiqh-depth gap found. Pairs naturally with the existing backlog item "Global madhab setting."
- [ ] `[M]` **Ramadan qada advance warning** — several apps (Nisaa's "Ramadan Countdown", flowdays' suhoor/iftar tracking) proactively warn "Ramadan starts in N days — you still owe M qada fasts" well before the month starts, rather than waiting for the user to open the fasting tracker. Rayhanah/FastingTracker already know both `qadaRemaining` and the Hijri-calendar Ramadan start date (`isRamadanNow`/`ramadan.ts`) — this is a notification/banner wiring task, not new domain logic.
- [ ] `[M]` **Recurring wuḍū-renewal reminder during istiḥāḍa** — Rayhanah shows a one-time static note that istiḥāḍa requires fresh wuḍū per prayer, but doesn't remind at each prayer time the way flowdays does ("wudu renewal reminders"). Worth a lightweight per-prayer nudge (reusing the existing salat notification plumbing) only while a logged cycle is actively flagged istiḥāḍa — narrow scope, don't generalize into a always-on reminder system.
- [ ] `[M]` **Cycle-aware AI guidance via Naseeh** — Nisaa's top paid tier is an AI assistant that answers cycle-and-fiqh questions "already in your madhab." Ihsan already has an AI companion (Naseeh) with a guardrail policy (see 1.2) — extending it with Rayhanah cycle-state + madhab context as retrieval input (never letting it invent fiqh rulings; only surfacing the app's own verified istihadha/hayd/ghusl copy plus general du'a/emotional support) is a natural, low-net-new-surface-area extension rather than a separate feature.
- [ ] `[L]` **Optional spouse/partner sync** — Ayda's paid "Partner Sync" shares cycle-phase status (not raw symptom logs) with a linked partner so he knows without her having to explain each time. Genuinely useful but sensitive: must be opt-in, revocable at any time, share status-only (e.g. "on her cycle" / "not"), never raw notes or the Garden of Light entries, and should be built only after the "Rayhanah hardening" privacy work above ships — sharing anything before the section itself is locked-down/encrypted would be backwards.
- [ ] `[S]` **Mustahab fasting-day highlighting in the shared calendar** — Nisaa highlights Arafah, Ashura, White Days (13th–15th), and the six days of Shawwal as recommended voluntary fasts. Ihsan's Fasting Tracker likely already knows these dates for its own logging; surfacing them as highlighted days on Rayhanah's calendar too (cross-checked against her cycle so it never suggests fasting on a hayd/nifas day) would be a small, genuinely thoughtful touch — a wife who just ended her period seeing "the White Days start in 2 days" is exactly the kind of "advantage for our sister" being asked for here.
- [ ] Explicitly **not** pursuing, based on this research: home-screen widgets (already tracked separately as a post-Capacitor item), a 20-language RTL rollout (already tracked separately, lower priority for this app's actual userbase), or a public "answer library" of fiqh articles (Rayhanah's existing inline istihadha/ghusl guides already cover the same ground contextually, which is a better UX than a separate article list).

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
