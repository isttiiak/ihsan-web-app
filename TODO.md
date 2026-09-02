# Ihsan — Feature Roadmap & TODO

## Zikr Counter

### Advanced Features
- [ ] **Offline sync** — queue increments in IndexedDB when offline, replay on reconnect
- [ ] **Vibration feedback** — optional haptic pulse on each count (mobile web)
- [ ] **Sound feedback** — optional subtle click/tap sound per count
- [ ] **Daily reminder notifications** — push/browser notification to prompt zikr session
- [ ] **Scheduled auto-reset** — option to reset at a specific time (e.g. Fajr) instead of midnight
- [ ] **Custom starting count** — begin a session from a non-zero number (e.g. 33/99)
- [ ] **Session history** — view past sessions with start/end time and counts per type
- [ ] **Tasbih mode** — cycle through SubhanAllah → Alhamdulillah → Allahu Akbar automatically at 33 each
- [ ] **Bulk custom types** — import/export custom dhikr list as JSON
- [ ] **Arabic keyboard input** — type custom dhikr directly in Arabic

### Analytics
- [ ] **Heatmap calendar view** — GitHub-style contribution grid per day
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
- [ ] **Kaza debt chart** — stacked bar showing accumulation vs payback over time (2026-09-02: current total shown as a stat tile; a historical trend chart needs periodic debt snapshots, not built yet)
- [ ] **Mosque frequency trend** — weekly mosque attendance rate
- [ ] **Best prayer streak per salat** — individual streaks for Fajr, Isha, etc.

---

## Prayer Times

- [ ] **Manual location entry** — type city name instead of relying on geolocation
- [ ] **Multiple calculation methods** — let user switch (MoonsightingCommittee, ISNA, MWL, etc.)
- [ ] **Qibla compass** — show direction to Mecca using device orientation
- [ ] **Hijri date display** — show current Hijri date on the prayer times page
- [ ] **Adhan audio** — optional in-browser adhan sound at prayer time
- [ ] **Offline caching** — store calculated times so the page works without internet

---

## Fasting Tracker (not yet built)

- [ ] **Daily fast log** — mark fasted / broke fast / exempt
- [ ] **Ramadan mode** — automatic 30-day tracking with suhoor/iftar times
- [ ] **Qadha fasts** — track missed Ramadan fasts and payback
- [ ] **Streak tracking** — Monday/Thursday Sunnah fasts streak
- [ ] **Analytics** — monthly completion rate, best streak, total fasts this year

---

## General / Infrastructure

- [ ] **PWA support** — service worker, installable on home screen, offline shell
- [ ] **Dark/light theme sync** — respect OS preference and auto-switch
- [ ] **Multi-language support** — Arabic, Bengali, Urdu UI strings
- [ ] **Account deletion** — GDPR-compliant data purge endpoint + UI flow
- [ ] **Email/password reset** — Firebase password reset flow in-app
- [ ] **Social login** — Google sign-in already works; add Apple sign-in
- [ ] **Rate limit feedback** — show toast instead of silent failure when 429 received
- [ ] **Backend tests** — Jest integration tests for zikr + salat + analytics routes
- [ ] **CI pipeline** — GitHub Actions: tsc + build check on every PR
