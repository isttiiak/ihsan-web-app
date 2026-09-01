// Bengali-izes a hadith/Quran citation string for display — WITHOUT touching
// the underlying English data (every `source`/`text`/`hadith` field across
// the app's data files stays English, verifiable, and byte-for-byte the same
// as when it was checked against sunnah.com/quran.com). This only transforms
// what's RENDERED: collection names → Bengali transliteration, grade words →
// Bengali, and every digit run → বাংলা numerals (০১২৩...).
//
// Longest names first so "Ṣaḥīḥ al-Bukhārī" matches before bare "Bukhārī".
const COLLECTION_BN: [string, string][] = [
  ['Ṣaḥīḥ al-Bukhārī', 'সহীহ বুখারী'],
  ['Ṣaḥīḥ Muslim', 'সহীহ মুসলিম'],
  ['Jāmiʿ al-Tirmidhī', 'জামিʼ আত-তিরমিযী'],
  ['Sunan Abī Dāwūd', 'সুনান আবু দাউদ'],
  ['Sunan Abū Dāwūd', 'সুনান আবু দাউদ'],
  ['Sunan Ibn Mājah', 'সুনান ইবনে মাজাহ'],
  ['Sunan an-Nasā’ī', 'সুনান আন-নাসাঈ'],
  ['Musnad Aḥmad', 'মুসনাদ আহমাদ'],
  ['Ibn Khuzaymah', 'ইবনে খুযাইমাহ'],
  ['Ibn Ḥibbān', 'ইবনে হিব্বান'],
  ['Ṣaḥīḥ at-Targhīb', 'সহীহ আত-তারগীব'],
  ['at-Targhīb', 'আত-তারগীব'],
  ['al-Mustadrak', 'আল-মুস্তাদরাক'],
  ['al-Ḥākim', 'আল-হাকিম'],
  ['al-Bayhaqī', 'আল-বায়হাকী'],
  ['Shuʿab al-Īmān', 'শুআবুল ঈমান'],
  ['Bukhārī', 'বুখারী'],
  ['Muslim', 'মুসলিম'],
  ['Tirmidhī', 'তিরমিযী'],
  ['Ibn Mājah', 'ইবনে মাজাহ'],
  ['an-Nasā’ī', 'আন-নাসাঈ'],
  ['Aḥmad', 'আহমাদ'],
  ['Quran', 'কুরআন'],
  // Plain-ASCII spellings (no diacritics) used in a few older strings —
  // same names, kept separate so the diacritic'd forms above still match first.
  ['Tirmidhi', 'তিরমিযী'],
  ['Bukhari', 'বুখারী'],
];

const GRADE_BN: [string, string][] = [
  ['ṣaḥīḥ li-ghairihi', 'সহীহ লিগাইরিহি'],
  ['ḥasan li-ghairihi', 'হাসান লিগাইরিহি'],
  ['ṣaḥīḥ', 'সহীহ'],
  ['ḥasan', 'হাসান'],
  ['ḍaʿīf', 'যঈফ'],
  ['gharīb', 'গরীব'],
  ['mawḍūʿ', 'জাল'],
  ['sahih', 'সহীহ'],
];

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
function digitsToBn(s: string): string {
  return s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]!);
}

function applyMap(s: string, map: [string, string][]): string {
  let out = s;
  for (const [en, bn] of map) out = out.split(en).join(bn);
  return out;
}

/** Translate a citation string (e.g. "Ṣaḥīḥ al-Bukhārī 998", "Quran 2:184–185",
 * "Tirmidhī 2891 (ḥasan)") for বাংলা display. No-op outside Bengali mode. */
export function translateReference(text: string, lang: string): string {
  if (lang !== 'bn' || !text) return text;
  let out = applyMap(text, COLLECTION_BN);
  out = applyMap(out, GRADE_BN);
  return digitsToBn(out);
}
