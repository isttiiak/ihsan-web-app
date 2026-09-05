# Changelog

All notable changes to Ihsan are documented here. Format is loosely [Keep a Changelog](https://keepachangelog.com/); versioning follows the project's existing convention (see "When to bump" in the project docs) rather than strict semver — patch = fixes, minor = a feature batch, major = a milestone.

## v5.6.0 — Hardening & Trust — 2026-09-06

A full audit pass against the codebase (see `ihsan-feature-audit-2026.md`) turned up several real correctness and privacy bugs — this release fixes the ones found so far, plus ships a few small features that came out of the same investigation.

### Fixed

- **Cross-account data leak on sign-out.** The sign-out button reset the wrong zikr-store action (`reset()`, which only zeroed the currently-selected dhikr type) instead of `resetAll()` — on a shared device, a previous account's lifetime totals and custom dhikr types could survive into the next sign-in. Also closed two related gaps: the debounced local-storage write wasn't flushed immediately on sign-out, and the offline salat outbox queue wasn't cleared at all.
- **Zikr counts lost on tab close.** Pending taps sitting in the debounced sync queue could be lost if the tab closed before the next flush. Now flushed immediately via `pagehide`/`visibilitychange` with `fetch(keepalive)`.
- **Salat updates lost offline.** A network failure while marking a prayer done silently rolled back the tap with no way to recover it. Added a local outbox that queues and replays failed writes once back online.
- **Kaffārah chain broken by ḥayḍ/nifās.** The 60-day consecutive-fast requirement was treated as broken by a menstrual/postpartum interruption, contrary to the majority fiqh position that a mandatory Sharīʿah-imposed break doesn't restart the count. Now bridges the gap correctly while still resetting on an ordinary missed day.
- **Location permission required a page reload.** Granting location access from the Home page updated the stored location but not the displayed prayer-time widget until the next reload, due to a stale `useMemo` dependency. Fixed, and the flow was also redesigned: clicking "Enable Prayer Times" now goes to the Prayer Times page where GPS and manual city search are both visible before any permission prompt fires, instead of triggering geolocation directly from a single ambiguous button.
- **Duplicate streak/goal display.** The navbar showed a second streak/goal capsule on the Zikr Counter page, identical to the one already in the counter card. Removed the redundant navbar display and its backing API call.
- **Quran surah cache pressure on `localStorage`.** Cached Quran text (114 surahs × translation combinations) was competing with every other feature for the shared ~5 MB `localStorage` quota. Moved to IndexedDB with a one-time migration for existing cached data.

### Added

- **Configurable streak grace days.** The "how many missed days does a streak forgive" rule was hardcoded to 1 — now configurable (0–3) per user, in Zikr Analytics' goal settings.
- **Friend request approval.** Connecting via invite code now sends a request instead of connecting instantly — the recipient accepts or declines.
- **Invisible leaderboard mode.** A full opt-out: when on, no one — not even existing friends — sees your Noor score or stats.
- **Block/unblock.** Blocking tears down any existing friendship or pending request and silently invalidates the person's invite link (same generic error as a bad code, so they're never told they were blocked specifically).
- **Rayhanah's Garden of Light checklist is now server-synced**, surviving a device switch or cache clear instead of living only in `localStorage`.
- **Version number in the footer**, sourced from `package.json` at build time.

### Removed

- Dead code: the legacy page-based Quran reading hook (superseded by the ayah-engine reader years ago, zero remaining call sites), and unused live-counter methods on the `ZikrStreak` model (the streak has been fully derived from daily buckets for a while; these were never called).

---

## Earlier releases

Only tracked from this point forward. For history before v5.6.0, see `git log --oneline` — recent notable tags: `v5.4.0` (Turāb design refresh, full Bengali support, bigger Salat Tracker), `v5.2.0` "Shahr" (Ramadan tracker), `v5.1.0` "Waṣl" (salat/zikr/Quran cross-linking), `v5.0.0` (first "stable" milestone), `v4.11.0` (Bengali i18n framework), `v4.10.0` (PWA/installable).
