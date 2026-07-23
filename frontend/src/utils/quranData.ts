// Quran text + metadata loaders — all from the free alquran.cloud API,
// cached hard in localStorage so each surah is fetched exactly once ever.

export interface SurahMeta {
  number: number;
  name: string;          // Arabic
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
] as const;

export function selectedTranslations(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem('ihsan_quran_translations') ?? '["en.sahih"]') as string[];
    const valid = raw.filter((id) => TRANSLATIONS.some((t) => t.id === id)).slice(0, 2);
    return valid.length ? valid : ['en.sahih'];
  } catch {
    return ['en.sahih'];
  }
}

const SURAH_META_KEY = 'ihsan_surah_meta_v1';

export async function loadSurahList(): Promise<SurahMeta[]> {
  try {
    const cached = localStorage.getItem(SURAH_META_KEY);
    if (cached) return JSON.parse(cached) as SurahMeta[];
  } catch { /* refetch */ }
  const res = await fetch('https://api.alquran.cloud/v1/surah');
  const data = await res.json() as { data: SurahMeta[] };
  const list = data.data.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType,
  }));
  localStorage.setItem(SURAH_META_KEY, JSON.stringify(list));
  return list;
}

const TRANSLIT_EDITION = 'en.transliteration';

/** Arabic (Uthmani) + the selected translations (1–2) for one surah, plus the
 * free transliteration edition when requested (pronunciation aid). */
export async function loadSurahText(surah: number, editions?: string[], withTranslit = false): Promise<AyahText[]> {
  const eds = (editions?.length ? editions : selectedTranslations()).slice(0, 2);
  const all = withTranslit ? [...eds, TRANSLIT_EDITION] : eds;
  const key = `ihsan_surah_text_${surah}_${all.join('+')}_v2`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached) as AyahText[];
  } catch { /* refetch */ }

  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surah}/editions/${['quran-uthmani', ...all].join(',')}`);
  const data = await res.json() as {
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
  try {
    localStorage.setItem(key, JSON.stringify(ayat));
  } catch { /* storage full — stream without cache */ }
  return ayat;
}

/** Per-ayah audio (Alafasy — the edition with full per-ayah coverage). */
export function ayahAudioUrl(globalAyahNumber: number): string {
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
}

// ── Juz lookup (standard 30-juz boundaries by surah:ayah) ─────────────────────
const JUZ_STARTS: Array<[number, number]> = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111],
  [7, 88], [8, 41], [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75],
  [21, 1], [23, 1], [25, 21], [27, 56], [29, 46], [33, 31], [36, 28], [39, 32],
  [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
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
export function locateGlobalAyah(index: number, surahs: SurahMeta[]): { surah: number; ayah: number } {
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
