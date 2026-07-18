// Curated Quran content — special surahs, authentic ayah bundles, and duas
// from the Quran itself. Reference policy (CLAUDE.md): every virtue claim
// links to quran.com / sunnah.com with the exact number; grades noted where
// the hadith is below sahih. Surahs whose popular virtues rest on weak
// narrations are listed WITHOUT a virtue claim (the recitation itself needs
// no certificate — Quran 73:4).

export interface SpecialSurah {
  surah: number;
  name: string;
  emoji: string;
  note: string;
  ref?: { text: string; url: string };
}

export const SPECIAL_SURAHS: SpecialSurah[] = [
  {
    surah: 67, name: 'Al-Mulk', emoji: '👑',
    note: 'Thirty verses that intercede for their reciter until he is forgiven.',
    ref: { text: 'Tirmidhī 2891 (ḥasan)', url: 'https://sunnah.com/tirmidhi:2891' },
  },
  {
    surah: 18, name: 'Al-Kahf', emoji: '🕯️',
    note: 'Its first ten verses are a protection from the Dajjāl; beloved on Fridays.',
    ref: { text: 'Muslim 809', url: 'https://sunnah.com/muslim:809' },
  },
  {
    surah: 2, name: 'Al-Baqarah', emoji: '🏰',
    note: 'Shayṭān flees the home in which Sūrat al-Baqarah is recited.',
    ref: { text: 'Muslim 780', url: 'https://sunnah.com/muslim:780' },
  },
  {
    surah: 36, name: 'Yā-Sīn', emoji: '💛',
    note: 'A beloved recitation for reflection on revelation and resurrection.',
  },
  {
    surah: 55, name: 'Ar-Raḥmān', emoji: '🌺',
    note: '"Which of the favours of your Lord will you deny?" — the surah of gratitude.',
  },
  {
    surah: 56, name: 'Al-Wāqiʿah', emoji: '⚖️',
    note: 'A vivid journey through the Day when ranks are decided.',
  },
  {
    surah: 32, name: 'As-Sajdah', emoji: '🌙',
    note: 'The Prophet ﷺ would not sleep until he recited it with al-Mulk.',
    ref: { text: 'Tirmidhī 2892 (ḥasan)', url: 'https://sunnah.com/tirmidhi:2892' },
  },
];

export interface AyahBundle {
  id: string;
  title: string;
  emoji: string;
  surah: number;
  fromAyah: number;
  toAyah: number;
  virtue: string;
  ref: { text: string; url: string };
}

export const AYAH_BUNDLES: AyahBundle[] = [
  {
    id: 'ayatul-kursi', title: 'Āyatul Kursī', emoji: '🛡️',
    surah: 2, fromAyah: 255, toAyah: 255,
    virtue: 'The greatest āyah in the Book of Allah; recited at night, a guardian remains with you.',
    ref: { text: 'Muslim 810 · Bukhārī 2311', url: 'https://sunnah.com/muslim:810' },
  },
  {
    id: 'baqarah-end', title: 'Last verses of al-Baqarah', emoji: '🌃',
    surah: 2, fromAyah: 285, toAyah: 286,
    virtue: 'Whoever recites the last two verses of al-Baqarah at night — they suffice him.',
    ref: { text: 'Bukhārī 5009', url: 'https://sunnah.com/bukhari:5009' },
  },
  {
    id: 'kahf-ten', title: 'First ten of al-Kahf', emoji: '🕯️',
    surah: 18, fromAyah: 1, toAyah: 10,
    virtue: 'Memorised, they are a protection from the Dajjāl.',
    ref: { text: 'Muslim 809', url: 'https://sunnah.com/muslim:809' },
  },
  {
    id: 'hashr-end', title: 'Last three of al-Ḥashr', emoji: '✨',
    surah: 59, fromAyah: 22, toAyah: 24,
    virtue: 'The names of Allah gathered — recited morning and evening.',
    ref: { text: 'Tirmidhī 2922 (gharīb — noted)', url: 'https://sunnah.com/tirmidhi:2922' },
  },
];

export interface QuranicDua {
  id: string;
  surah: number;
  fromAyah: number;
  toAyah: number;
  title: string;
  emoji: string;
}

export const QURANIC_DUAS: QuranicDua[] = [
  { id: 'dua-both-worlds', surah: 2, fromAyah: 201, toAyah: 201, emoji: '🌍', title: 'Good in this world & the next' },
  { id: 'dua-steadfast', surah: 3, fromAyah: 8, toAyah: 8, emoji: '⚓', title: 'Keep my heart firm after guidance' },
  { id: 'dua-forgive-us', surah: 7, fromAyah: 23, toAyah: 23, emoji: '🤲', title: 'The duʿā of Ādam — forgive us' },
  { id: 'dua-salat-descendants', surah: 14, fromAyah: 40, toAyah: 41, emoji: '🕌', title: 'Make me steadfast in prayer' },
  { id: 'dua-mercy-affair', surah: 18, fromAyah: 10, toAyah: 10, emoji: '🏞️', title: 'The cave companions — mercy & guidance' },
  { id: 'dua-musa', surah: 20, fromAyah: 25, toAyah: 28, emoji: '🗣️', title: 'Mūsā — expand my chest, ease my task' },
  { id: 'dua-refuge-shayatin', surah: 23, fromAyah: 97, toAyah: 98, emoji: '🛡️', title: 'Refuge from the whispers of devils' },
  { id: 'dua-coolness-eyes', surah: 25, fromAyah: 74, toAyah: 74, emoji: '👨‍👩‍👧', title: 'Spouses & children — coolness of eyes' },
];
