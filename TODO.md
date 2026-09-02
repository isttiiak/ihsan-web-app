# Ihsan — Feature Roadmap & TODO

> Checked off items were verified against the actual code on 2026-09-02 (not
> just assumed) — see the note on each. An unchecked item means it genuinely
> isn't built yet.

## Zikr Counter

### Advanced Features
- [ ] **Offline sync** — queue increments in IndexedDB when offline, replay on reconnect
- [ ] **Sound feedback** — optional subtle click/tap sound per count
- [ ] **Daily reminder notifications** — push/browser notification to prompt zikr session
- [ ] **Scheduled auto-reset** — option to reset at a specific time (e.g. Fajr) instead of midnight
- [ ] **Custom starting count** — begin a session from a non-zero number (e.g. 33/99)
- [ ] **Session history** — view past sessions with start/end time and counts per type
- [ ] **Tasbih mode** — cycle through SubhanAllah → Alhamdulillah → Allahu Akbar automatically at 33 each
- [ ] **Bulk custom types** — import/export custom dhikr list as JSON
- [ ] **Arabic keyboard input** — type custom dhikr directly in Arabic

*(Vibration feedback moved to **Native Mobile Features** below — it's already built.)*

### Analytics
- [ ] **Heatmap calendar view** — GitHub-style contribution grid per day (Salat already has this full grid; Zikr Analytics only has a 7-day mini strip so far)
- [ ] **Time-of-day chart** — when during the day does the user count most?
- [ ] **Per-type trend lines** — individual line per dhikr type over time
- [ ] **Personal records** — best single session, best hour, most types in one day
- [ ] **Export analytics** — download CSV of daily totals

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
- [ ] **Multiple calculation methods** — let user switch (MoonsightingCommittee, ISNA, MWL, etc.) (only the Ḥanafī/Shāfiʿī ʿAṣr-madhab toggle exists; the underlying method is hardcoded to MoonsightingCommittee)
- [x] **Hijri date display** — show current Hijri date on the prayer times page (already built — `getHijriToday()` rendered under the live clock)
- [ ] **Adhan audio** — optional in-browser adhan sound at prayer time
- [x] **Offline caching** — store calculated times so the page works without internet (times are computed client-side from cached location with no network call, and the PWA shell is precached — already effectively offline-capable)

---

## Native Mobile Features

> Capabilities that only do anything in a mobile browser (device hardware the
> desktop web simply doesn't have). Kept separate so the lists above stay
> "works for every visitor."

- [x] **Vibration feedback** — haptic pulse on each zikr count, Android/mobile Chrome only (`navigator.vibrate`, already built in `ZikrCounter.tsx`)
- [ ] **Qibla compass** — direction to Mecca using the device orientation sensor (moved from Prayer Times — desktops have no compass/orientation sensor to read)

---

## Fasting Tracker

*(Built — the "not yet built" heading above was stale; the tracker, Ramadan mode, and analytics have all shipped.)*

- [x] **Daily fast log** — mark fasted / broke fast / exempt
- [x] **Ramadan mode** — automatic 30-day tracking with suhoor/iftar times (dedicated `/ramadan` tracker)
- [x] **Qadha fasts** — track missed Ramadan fasts and payback (`qadaOwed`/`qadaDone` in FastingProfile)
- [ ] **Streak tracking** — Monday/Thursday Sunnah fasts streak (voluntary fasting is logged, but there's no dedicated streak counter for it yet)
- [x] **Analytics** — monthly completion rate, total fasts this year (all-time/this-month/last-30-days stats + a 12-month trend chart exist; there's no "best streak" stat yet — same gap as the line above)

---

## General / Infrastructure

- [x] **PWA support** — service worker, installable on home screen, offline shell (already built — `vite-plugin-pwa` + workbox)
- [~] **Dark/light theme sync** — respect OS preference and auto-switch — **superseded by product decision**: the UI is intentionally fixed dark; theme selection was removed from Settings. Not a gap to fill.
- [~] **Multi-language support** — Arabic, Bengali, Urdu UI strings — **Bengali: mostly done, not fully.** `en`/`bn` key parity is 100% (1880/1880) across every translated screen, but three areas were never wired to i18n at all: the auth flow (`AuthSignIn.tsx`, `AuthSignUp.tsx`, `AuthAction.tsx`), the AI companion components (`ai/FastingCompanion.tsx`, `ai/NaseehInsights.tsx`, `ai/StreakCoaching.tsx`, `ai/AiFlair.tsx`), and `DaifExplainer.tsx`'s scholarly content. Arabic/Urdu not started.
- [ ] **Account deletion** — GDPR-compliant data purge endpoint + UI flow (Settings' danger zone deletes each feature's data — zikr/salat/fasting/quran/cycle — individually, but there is no "delete my whole account" flow that also removes the Firebase auth user)
- [x] **Email/password reset** — Firebase password reset flow in-app (already built — `sendPasswordResetEmail` in `AuthSignIn.tsx`)
- [ ] **Social login** — Google sign-in already works; add Apple sign-in
- [x] **Rate limit feedback** — show toast instead of silent failure when 429 received (already built — axios interceptor in `lib/api.ts`)
- [~] **Backend tests** — Jest integration tests for zikr + salat + analytics routes — **partial.** `zikr`, `fasting`, `quran`, `cycle`, `social`, and `user` all have e2e suites (54 tests total); **salat has no test file at all**, despite being named here and having grown a lot recently (debt tracker, debt history, streaks, mosque trend).
- [ ] **CI pipeline** — GitHub Actions: tsc + build check on every PR
