// Salat preferences — mirrors utils/quranPrefs.ts. Plain localStorage (read
// synchronously; no zustand rehydrate race) so the salat tracker and the
// prayer-time maths can both read them on first paint.
//
// Every reference below was verified on sunnah.com.

import { TAHLIL_NAME } from './zikrLibrary.js';

// ─── after-ṣalāh tasbīḥ ─────────────────────────────────────────────────────

/**
 * The two authentic ways to reach a hundred after every fard prayer.
 * Both are ṣaḥīḥ; the worshipper follows whichever they habitually pray, so
 * the app must not assume one. This setting tells the tracker how many counts
 * to credit when the "tasbīḥ" tag is tapped.
 */
export type TasbihMode = 'tahlil' | 'takbir34';

export interface TasbihStep {
  /** Counter key in the zikr list — must match a CORE_ZIKR name exactly. */
  zikr: string;
  count: number;
}

export interface TasbihModeMeta {
  id: TasbihMode;
  label: string;
  summary: string;
  steps: TasbihStep[];
  source: string;
  sourceUrl: string;
  grade: string;
  virtue?: string;
}

export const TASBIH_MODES: TasbihModeMeta[] = [
  {
    id: 'tahlil',
    label: '33 · 33 · 33 + tahlīl',
    summary: 'Ninety-nine, then one tahlīl completes the hundred.',
    steps: [
      { zikr: 'SubhanAllah', count: 33 },
      { zikr: 'Alhamdulillah', count: 33 },
      { zikr: 'Allahu Akbar', count: 33 },
      { zikr: TAHLIL_NAME, count: 1 },
    ],
    source: 'Ṣaḥīḥ Muslim 597a',
    sourceUrl: 'https://sunnah.com/muslim:597',
    grade: 'Ṣaḥīḥ',
    virtue: '"His sins are forgiven even if they are like the foam of the sea."',
  },
  {
    id: 'takbir34',
    label: '33 · 33 · 34',
    summary: 'Thirty-four takbīrs complete the hundred.',
    steps: [
      { zikr: 'SubhanAllah', count: 33 },
      { zikr: 'Alhamdulillah', count: 33 },
      { zikr: 'Allahu Akbar', count: 34 },
    ],
    source: 'Ṣaḥīḥ Muslim 596a',
    sourceUrl: 'https://sunnah.com/muslim:596',
    grade: 'Ṣaḥīḥ',
    virtue: '"The repeaters of these after every prescribed prayer will never be disappointed."',
  },
];

const TASBIH_KEY = 'ihsan_tasbih_mode';
/** Muslim 597a — the combination most commonly taught, and the one that gives
 * the tahlīl its place. Chosen as the default; either is authentic. */
export const DEFAULT_TASBIH_MODE: TasbihMode = 'tahlil';

export function getTasbihMode(): TasbihMode {
  try {
    const v = localStorage.getItem(TASBIH_KEY);
    return v === 'takbir34' || v === 'tahlil' ? v : DEFAULT_TASBIH_MODE;
  } catch {
    return DEFAULT_TASBIH_MODE;
  }
}

export function setTasbihMode(mode: TasbihMode): void {
  try { localStorage.setItem(TASBIH_KEY, mode); } catch { /* private mode */ }
}

export function tasbihModeMeta(mode: TasbihMode): TasbihModeMeta {
  return TASBIH_MODES.find((m) => m.id === mode) ?? TASBIH_MODES[0];
}

/** The dhikr deltas one tasbīḥ tag is worth, as a {name: amount} map ready for
 * useZikrStore.addCounts(). Pass sign -1 to reverse an un-tapped tag. */
export function tasbihDeltas(mode: TasbihMode, sign: 1 | -1 = 1): Record<string, number> {
  const out: Record<string, number> = {};
  for (const step of tasbihModeMeta(mode).steps) {
    out[step.zikr] = (out[step.zikr] ?? 0) + step.count * sign;
  }
  return out;
}

/** Ayat al-Kursi after every fard prayer — one recitation per tag.
 * "Whoever recites Ayat al-Kursi after every prescribed prayer, nothing
 * prevents him from entering Paradise except death."
 * an-Nasāʾī, ʿAmal al-Yawm wa'l-Layla — ṣaḥīḥ per al-Albānī
 * (Silsilah aṣ-Ṣaḥīḥah 972). */
export const AYATUL_KURSI_ZIKR = 'Ayatul Kursi';
export const AYATUL_KURSI_REF = {
  source: 'an-Nasāʾī, ʿAmal al-Yawm wa\'l-Layla 100',
  grade: 'Ṣaḥīḥ (al-Albānī, Silsilah aṣ-Ṣaḥīḥah 972)',
  virtue: 'Nothing prevents him from entering Paradise except death.',
};

// ─── ʿAṣr calculation school ────────────────────────────────────────────────

/**
 * The one genuine fiqh difference in the daily timetable: ʿAṣr begins when an
 * object's shadow equals its own length plus the noon shadow (Shāfiʿī, Mālikī,
 * Ḥanbalī) or TWICE its length (Ḥanafī). Because Ẓuhr runs until ʿAṣr starts,
 * moving one moves the other — a single setting governs both.
 */
export type AsrMadhab = 'standard' | 'hanafi';

const ASR_KEY = 'ihsan_asr_madhab';
/** What every existing user has been seeing (adhan's default) — keeping it as
 * the default means nobody's timetable shifts under them after this update. */
export const DEFAULT_ASR_MADHAB: AsrMadhab = 'standard';

export const ASR_MADHABS: { id: AsrMadhab; label: string; detail: string }[] = [
  {
    id: 'standard',
    label: 'Standard',
    detail: 'Shāfiʿī · Mālikī · Ḥanbalī — ʿAṣr when the shadow equals the object\'s length. Ẓuhr ends earlier.',
  },
  {
    id: 'hanafi',
    label: 'Ḥanafī',
    detail: 'ʿAṣr when the shadow is twice the object\'s length — ʿAṣr starts later, so Ẓuhr runs longer.',
  },
];

export function getAsrMadhab(): AsrMadhab {
  try {
    const v = localStorage.getItem(ASR_KEY);
    return v === 'hanafi' || v === 'standard' ? v : DEFAULT_ASR_MADHAB;
  } catch {
    return DEFAULT_ASR_MADHAB;
  }
}

export function setAsrMadhab(m: AsrMadhab): void {
  try { localStorage.setItem(ASR_KEY, m); } catch { /* private mode */ }
}
