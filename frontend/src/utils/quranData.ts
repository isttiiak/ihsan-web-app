// Quran text + metadata loaders — all from the free alquran.cloud API,
// cached hard in IndexedDB so each surah is fetched exactly once ever.
//
// This used to live in localStorage, but a full Quran cache (114 surahs ×
// translation-edition combos, 50-500 KB each) routinely approached or
// exceeded the ~5 MB localStorage quota that every OTHER feature in the app
// also shares — writes would silently fail once full. IndexedDB has a much
// larger practical quota and doesn't block the main thread on large reads.

import { SURAH_NAMES_BN } from './surahNamesBn.js';
import { SURAH_MEANINGS_BN } from './surahMeaningsBn.js';
import { idbGet, idbSet } from './idbCache.js';

export interface SurahMeta {
  number: number;
  name: string; // Arabic
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType?: string;
}

export interface AyahText {
  /** 1-based within the surah */
  numberInSurah: number;
  /** Global ayah number 1..6236 — used for per-ayah audio + khatam math */
  number: number;
  arabic: string;
  /** Translation texts in the same order as the requested edition ids */
  translations: string[];
  /** Latin pronunciation (alquran.cloud en.transliteration) — present only
   * when the reader has transliteration enabled */
  transliteration?: string;
}

/** Translations the reader can show (up to two at once — Istiak's spec). */
export const TRANSLATIONS = [
  { id: 'en.sahih', label: 'English — Ṣaḥīḥ International' },
  { id: 'bn.bengali', label: 'Bengali — মুহিউদ্দীন খান' },
  { id: 'bn.hoque', label: 'Bengali — জহুরুল হক' },
] as const;

/** Surah display name in the app's current language — the Bengali table is a
 * transliteration (how the Arabic name is written in Bengali script), not a
 * meaning translation, to match `englishName`'s convention. */
export function surahDisplayName(
  meta: Pick<SurahMeta, 'number' | 'englishName'>,
  lang: string
): string {
  if (lang === 'bn') return SURAH_NAMES_BN[meta.number] ?? meta.englishName;
  return meta.englishName;
}

/** Surah MEANING in the app's current language (e.g. "The Opening" /
 * "সূচনা") — sourced from quran.com's own API, one of this app's two
 * authorized reference sources. Parallel to `englishNameTranslation`. */
export function surahMeaningDisplay(
  meta: Pick<SurahMeta, 'number' | 'englishNameTranslation'>,
  lang: string
): string {
  if (lang === 'bn') return SURAH_MEANINGS_BN[meta.number] ?? meta.englishNameTranslation;
  return meta.englishNameTranslation;
}

const LANG_TO_TRANSLATION: Record<string, string> = {
  en: 'en.sahih',
  bn: 'bn.bengali',
};

export function selectedTranslations(): string[] {
  try {
    const raw = JSON.parse(
      localStorage.getItem('ihsan_quran_translations') ?? '["en.sahih"]'
    ) as string[];
    const valid = raw.filter((id) => TRANSLATIONS.some((t) => t.id === id)).slice(0, 2);
    return valid.length ? valid : ['en.sahih'];
  } catch {
    return ['en.sahih'];
  }
}

/** When the app language changes, update the Quran primary translation to match. */
export function syncQuranTranslationWithLang(lang: string): void {
  const target = LANG_TO_TRANSLATION[lang];
  if (!target) return;
  const current = selectedTranslations();
  if (current[0] === target) return;
  const secondary = current[1] && current[1] !== target ? current[1] : undefined;
  const next = secondary ? [target, secondary] : [target];
  localStorage.setItem('ihsan_quran_translations', JSON.stringify(next));
}

const SURAH_META_KEY = 'ihsan_surah_meta_v1';

/** One-time move of a value cached under `localStorageKey` into IndexedDB —
 * returns it and frees the localStorage entry, instead of discarding a
 * perfectly good cache and paying for a refetch. */
function migrateFromLocalStorage<T>(localStorageKey: string): T | undefined {
  try {
    const raw = localStorage.getItem(localStorageKey);
    if (!raw) return undefined;
    localStorage.removeItem(localStorageKey);
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function loadSurahList(): Promise<SurahMeta[]> {
  const fromIdb = await idbGet<SurahMeta[]>(SURAH_META_KEY);
  if (fromIdb) return fromIdb;
  const migrated = migrateFromLocalStorage<SurahMeta[]>(SURAH_META_KEY);
  if (migrated) {
    void idbSet(SURAH_META_KEY, migrated); // persist it into IndexedDB going forward
    return migrated;
  }
  const res = await fetch('https://api.alquran.cloud/v1/surah');
  const data = (await res.json()) as { data: SurahMeta[] };
  const list = data.data.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType,
  }));
  await idbSet(SURAH_META_KEY, list);
  return list;
}

const TRANSLIT_EDITION = 'en.transliteration';

/** Arabic (Uthmani) + the selected translations (1–2) for one surah, plus the
 * free transliteration edition when requested (pronunciation aid). */
export async function loadSurahText(
  surah: number,
  editions?: string[],
  withTranslit = false
): Promise<AyahText[]> {
  const eds = (editions?.length ? editions : selectedTranslations()).slice(0, 2);
  const all = withTranslit ? [...eds, TRANSLIT_EDITION] : eds;
  const key = `ihsan_surah_text_${surah}_${all.join('+')}_v2`;

  const fromIdb = await idbGet<AyahText[]>(key);
  if (fromIdb) return fromIdb;
  const migrated = migrateFromLocalStorage<AyahText[]>(key);
  if (migrated) {
    void idbSet(key, migrated);
    return migrated;
  }

  const res = await fetch(
    `https://api.alquran.cloud/v1/surah/${surah}/editions/${['quran-uthmani', ...all].join(',')}`
  );
  const data = (await res.json()) as {
    data: Array<{ ayahs: Array<{ number: number; numberInSurah: number; text: string }> }>;
  };
  const [ar, ...rest] = data.data;
  const trs = withTranslit ? rest.slice(0, -1) : rest;
  const translit = withTranslit ? rest[rest.length - 1] : undefined;
  const ayat: AyahText[] = (ar?.ayahs ?? []).map((a, i) => ({
    numberInSurah: a.numberInSurah,
    number: a.number,
    arabic: a.text,
    translations: trs.map((tr) => tr?.ayahs?.[i]?.text ?? ''),
    ...(translit ? { transliteration: translit.ayahs?.[i]?.text ?? '' } : {}),
  }));
  await idbSet(key, ayat);
  return ayat;
}

/** Per-ayah audio (Alafasy — the edition with full per-ayah coverage). */
export function ayahAudioUrl(globalAyahNumber: number): string {
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
}

// ── Juz lookup (standard 30-juz boundaries by surah:ayah) ─────────────────────
const JUZ_STARTS: Array<[number, number]> = [
  [1, 1],
  [2, 142],
  [2, 253],
  [3, 93],
  [4, 24],
  [4, 148],
  [5, 82],
  [6, 111],
  [7, 88],
  [8, 41],
  [9, 93],
  [11, 6],
  [12, 53],
  [15, 1],
  [17, 1],
  [18, 75],
  [21, 1],
  [23, 1],
  [25, 21],
  [27, 56],
  [29, 46],
  [33, 31],
  [36, 28],
  [39, 32],
  [41, 47],
  [46, 1],
  [51, 31],
  [58, 1],
  [67, 1],
  [78, 1],
];

export function juzOf(surah: number, ayah: number): number {
  let juz = 1;
  for (let i = 0; i < JUZ_STARTS.length; i++) {
    const [s, a] = JUZ_STARTS[i]!;
    if (surah > s || (surah === s && ayah >= a)) juz = i + 1;
    else break;
  }
  return juz;
}

/** surah/ayah-in-surah for a 0-based global ayah index (khatam position). */
export function locateGlobalAyah(
  index: number,
  surahs: SurahMeta[]
): { surah: number; ayah: number } {
  let rest = index;
  for (const s of surahs) {
    if (rest < s.numberOfAyahs) return { surah: s.number, ayah: rest + 1 };
    rest -= s.numberOfAyahs;
  }
  return { surah: 114, ayah: 6 };
}

/** 0-based global index of surah:ayah (inverse of locateGlobalAyah). */
export function globalIndexOf(surah: number, ayah: number, surahs: SurahMeta[]): number {
  let idx = 0;
  for (const s of surahs) {
    if (s.number === surah) return idx + (ayah - 1);
    idx += s.numberOfAyahs;
  }
  return 0;
}
