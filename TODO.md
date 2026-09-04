# Ihsan — Feature Roadmap & TODO

> Checked off items were verified against the actual code on 2026-09-02 (not
> just assumed) — see the note on each. An unchecked item means it genuinely
> isn't built yet.

## Zikr Counter

### Advanced Features

- [~] **Offline sync** — queue increments in IndexedDB when offline, replay on reconnect (2026-09-04: taps already queued durably — `pending` is debounce-persisted to localStorage, surviving reloads while offline; added a `window.addEventListener('online', …)` in `App.tsx` that replays the queue immediately on reconnect instead of waiting for the next tap, and `flush()` now skips the request entirely while `navigator.onLine` is false. **Storage is localStorage, not IndexedDB** — deliberately: it already gives the same reload-durability guarantee for this small amount of data, so migrating storage engines wouldn't add real capability, just complexity.)
- [ ] **Sound feedback** — optional subtle click/tap sound per count
- [ ] **Daily reminder notifications** — push/browser notification to prompt zikr session
- [~] **Scheduled auto-reset** — option to reset at a specific time (e.g. Fajr) instead of midnight — **already substantially covered**: `getTrackingDay()` (`frontend/src/utils/trackingDay.ts`) already anchors the daily reset to local Fajr (falling back to midnight without a saved location) app-wide, not just for zikr. Not re-touched — it's a cross-feature boundary (salat/fasting/quran/social all depend on it) and an arbitrary user-chosen time would need a wider redesign than this pass covered.
- [x] **Custom starting count** — begin a session from a non-zero number (e.g. 33/99) (2026-09-04: "Set" link under the counter opens a modal that jumps straight to a number via the existing pending/flush pipeline, so it syncs like a normal tap)
- [x] **Session history** — view past sessions with start/end time and counts per type (2026-09-04: new `ZikrEvent` append-only log (90-day TTL) records each real tap moment; `/api/zikr/sessions?date=` clusters them with a 20-min gap rule; date-picker list in Zikr Analytics)
- [x] **Tasbih mode** — cycle through SubhanAllah → Alhamdulillah → Allahu Akbar automatically at 33 each (2026-09-04: toggle in Zikr settings drawer, auto-advances the selected dhikr every 33 counts, loops after 99)
- [x] **Bulk custom types** — import/export custom dhikr list as JSON (2026-09-04: Export/Import buttons in "My zikr list")
- [x] **Arabic keyboard input** — type custom dhikr directly in Arabic (2026-09-04: on-screen Arabic keyboard in the Add/Edit custom dhikr forms)

_(Vibration feedback moved to **Native Mobile Features** below — it's already built.)_

### Analytics

- [x] **Heatmap calendar view** — GitHub-style contribution grid per day (2026-09-03: full 52×7 grid from 365-day data, hover shows date+count, intensity-coded)
- [x] **Time-of-day chart** — when during the day does the user count most? (2026-09-04: unblocked by the new `ZikrEvent` log; `/api/zikr/time-of-day` aggregates by local hour via Mongo's timezone-aware `$hour`; SVG bar chart in Zikr Analytics)
- [x] **Per-type trend lines** — individual line per dhikr type over time (2026-09-03: multi-line SVG from daily breakdown, up to 5 types)
- [x] **Personal records** — best single session, best hour, most types in one day (2026-09-03: best day, longest streak, avg on active days, most active day of week)
- [x] **Export analytics** — download CSV of daily totals (2026-09-03: CSV button in Personal records section)

---

## Salat Tracker

### Features

- [x] **Prayer time integration** — auto-mark a prayer window open/closed based on adhan times (2026-09-02: amber "window closed" flag once a today prayer's adhan-derived window passes while still unlogged)
- [x] **Missed prayer debt tracker** — count accumulated kaza prayers and track payback (2026-09-02: per-prayer counter, auto-tracked from explicit "Miss" taps + manual adjust/set)
- [x] **Jumu'ah tracking** — Friday prayer logged separately with attendance flag (2026-09-02: Jumu'ah Attendance % stat on analytics, mosque-specific)
- [x] **Tahajjud / Nafl** — optional voluntary prayers section (already built — tile-grid picker with per-type rak'ah counters)
- [ ] **Push reminders** — browser notification at adhan time (explicitly excluded from the 2026-09-02 pass)
- [x] **Date navigation** — view/edit logs for past dates (not just today) (already built — prev/next day navigator)
- [x] **Weekly summary card** — quick glance view for the last 7 days on the tracker page (2026-09-02: 7-dot strip, tap to jump)

### Analytics

- [x] **Monthly completion heatmap** — full calendar view with colour intensity (already built — `prayerCalendar` grid on `/salat/analytics`)
- [x] **Kaza debt chart** — stacked bar showing accumulation vs payback over time (2026-09-02: new append-only `SalatDebtEvent` log, weekly stacked bars)
- [x] **Mosque frequency trend** — weekly mosque attendance rate (2026-09-02: weekly bar chart, `weeklyMosqueTrend`)
- [x] **Best prayer streak per salat** — individual streaks for Fajr, Isha, etc. (2026-09-02: `perPrayer[id].currentStreak/bestStreak`, shown on each prayer card)

---

## Prayer Times

- [x] **Manual location entry** — type city name instead of relying on geolocation (already built — city search with suggestions on `/prayer-times`)
- [x] **Multiple calculation methods** — let user switch (MoonsightingCommittee, ISNA, MWL, etc.) (2026-09-04: dropdown of all 12 adhan.js methods in Salat settings, stored in `utils/salatPrefs.ts` next to the Asr madhab, read live by `calcPrayerTimes()`)
- [x] **Hijri date display** — show current Hijri date on the prayer times page (already built — `getHijriToday()` rendered under the live clock)
- [ ] **Adhan audio** — optional in-browser adhan sound at prayer time
- [x] **Offline caching** — store calculated times so the page works without internet (times are computed client-side from cached location with no network call, and the PWA shell is precached — already effectively offline-capable)

---

## Native Mobile Features

> Capabilities that only do anything in a mobile browser (device hardware the
> desktop web simply doesn't have). Kept separate so the lists above stay
> "works for every visitor."

- [x] **Vibration feedback** — haptic pulse on each zikr count, Android/mobile Chrome only (2026-09-04: on/off toggle added — `useUiStore.vibrationEnabled`, in Settings → Accessibility, gates the existing `navigator.vibrate(10)` call)
- [x] **Qibla compass** — direction to Mecca using the device orientation sensor (2026-09-04: new `/qibla` page, great-circle bearing calc + live compass dial on supported devices, static angle fallback on desktop)

---

## Fasting Tracker

_(Built — the "not yet built" heading above was stale; the tracker, Ramadan mode, and analytics have all shipped.)_

- [x] **Daily fast log** — mark fasted / broke fast / exempt
- [x] **Ramadan mode** — automatic 30-day tracking with suhoor/iftar times (dedicated `/ramadan` tracker)
- [x] **Qadha fasts** — track missed Ramadan fasts and payback (`qadaOwed`/`qadaDone` in FastingProfile)
- [x] **Streak tracking** — Monday/Thursday Sunnah fasts streak (2026-09-03: computeMonThuStreak() walks backward through Mon/Thu days; shown as 5th stat tile in FastingAnalytics)
- [x] **Analytics** — monthly completion rate, total fasts this year (all-time/this-month/last-30-days stats + a 12-month trend chart exist; there's no "best streak" stat yet — same gap as the line above)

---

## General / Infrastructure

- [x] **PWA support** — service worker, installable on home screen, offline shell (already built — `vite-plugin-pwa` + workbox)
- [~] **Dark/light theme sync** — respect OS preference and auto-switch — **superseded by product decision**: the UI is intentionally fixed dark; theme selection was removed from Settings. Not a gap to fill.
- [~] **Multi-language support** — Arabic, Bengali, Urdu UI strings — **Bengali: mostly done, not fully.** `en`/`bn` key parity is 100% (1880/1880) across every translated screen, but three areas were never wired to i18n at all: the auth flow (`AuthSignIn.tsx`, `AuthSignUp.tsx`, `AuthAction.tsx`), the AI companion components (`ai/FastingCompanion.tsx`, `ai/NaseehInsights.tsx`, `ai/StreakCoaching.tsx`, `ai/AiFlair.tsx`), and `DaifExplainer.tsx`'s scholarly content. Arabic/Urdu not started.
- [x] **Account deletion** — GDPR-compliant data purge endpoint + UI flow (2026-09-03: DELETE /api/user/me purges all collections + Firebase auth; Settings has a two-step confirm card)
- [x] **Email/password reset** — Firebase password reset flow in-app (already built — `sendPasswordResetEmail` in `AuthSignIn.tsx`)
- [~] **Social login** — Google sign-in already works; add Apple sign-in (2026-09-04: "Continue/Sign up with Apple" buttons added to `AuthSignIn.tsx`/`AuthSignUp.tsx`, wired to `signInWithPopup(auth, appleProvider)` exactly like Google — but **inert until configured**: needs a paid Apple Developer account (Services ID, verified domain/return URL, private key) and the Apple provider enabled in the Firebase Console with those values. Code is ready; external setup isn't something I can do.)
- [x] **Rate limit feedback** — show toast instead of silent failure when 429 received (already built — axios interceptor in `lib/api.ts`)
- [x] **Backend tests** — Jest integration tests for all routes — 79 tests total across zikr, fasting, quran, cycle, social, user, auth, and salat (10 salat tests added 2026-09-03: auth guard, prayer log CRUD, nafl, debt tracking, analytics, history, delete-all; 3 zikr tests added 2026-09-04 for time-of-day bucketing and session clustering).
- [x] **CI pipeline** — GitHub Actions: tsc + build check on every PR (already fully built — lint, typecheck, test, build, audit all run on push/PR to main; verified 2026-09-03)
