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
  /** The story/evidence BEHIND the duʿā — who said it, when, and why it is
   * treasured. `ref` is always a verifiable link (sunnah.com or quran.com). */
  context?: {
    text: string;
    ref: { text: string; url: string };
  };
}

// Every entry is a duʿā Allah Himself relates in the Quran — taught through
// His prophets and the righteous. Short enough to memorize; contexts cite
// only verifiable sources (no weak-hadith virtue claims).
export const QURANIC_DUAS: QuranicDua[] = [
  {
    id: 'dua-both-worlds', surah: 2, fromAyah: 201, toAyah: 201, emoji: '🌍', title: 'Good in this world & the next',
    context: {
      text: 'Anas (ra) said this "Rabbanā ātinā…" was the supplication the Prophet ﷺ made MOST often — one line that gathers both worlds and protection from the Fire.',
      ref: { text: 'Bukhārī 6389', url: 'https://sunnah.com/bukhari:6389' },
    },
  },
  {
    id: 'dua-steadfast', surah: 3, fromAyah: 8, toAyah: 8, emoji: '⚓', title: 'Keep my heart firm after guidance',
    context: {
      text: 'The duʿā of those firm in knowledge (ar-rāsikhūna fil-ʿilm) — asking Allah not to let the heart swerve after He has guided it. The Prophet ﷺ often swore "O Turner of the hearts…", the same meaning.',
      ref: { text: 'Quran 3:7-8 · cf. Tirmidhī 2140', url: 'https://quran.com/3/8' },
    },
  },
  {
    id: 'dua-forgive-us', surah: 7, fromAyah: 23, toAyah: 23, emoji: '🤲', title: 'The duʿā of Ādam — forgive us',
    context: {
      text: 'The very first istighfār of mankind: the words Ādam and Ḥawwā said after the slip in the Garden — and with them Allah turned to them in mercy (2:37).',
      ref: { text: 'Quran 7:23 · 2:37', url: 'https://quran.com/7/23' },
    },
  },
  {
    id: 'dua-salat-descendants', surah: 14, fromAyah: 40, toAyah: 41, emoji: '🕌', title: 'Make me steadfast in prayer',
    context: {
      text: 'Ibrāhīm (as), in old age after being granted Ismāʿīl and Isḥāq, asks that he AND his descendants remain establishers of salat — a duʿā for generations you will never meet.',
      ref: { text: 'Quran 14:35-41', url: 'https://quran.com/14/40' },
    },
  },
  {
    id: 'dua-mercy-affair', surah: 18, fromAyah: 10, toAyah: 10, emoji: '🏞️', title: 'The cave companions — mercy & guidance',
    context: {
      text: 'Said by the young believers of the Cave as they fled a tyrant with nothing but their faith — Allah answered with a miracle that lasted three centuries.',
      ref: { text: 'Quran 18:9-26', url: 'https://quran.com/18/10' },
    },
  },
  {
    id: 'dua-musa', surah: 20, fromAyah: 25, toAyah: 28, emoji: '🗣️', title: 'Mūsā — expand my chest, ease my task',
    context: {
      text: 'Mūsā (as) said this when commanded to face Firʿawn — the duʿā before any daunting task, speech or confrontation.',
      ref: { text: 'Quran 20:24-36', url: 'https://quran.com/20/25' },
    },
  },
  {
    id: 'dua-knowledge', surah: 20, fromAyah: 114, toAyah: 114, emoji: '📚', title: 'Rabbi zidnī ʿilmā — increase me in knowledge',
    context: {
      text: 'The one thing Allah commanded His Prophet ﷺ to ask for MORE of — knowledge. Three words for every student, before every lesson.',
      ref: { text: 'Quran 20:114', url: 'https://quran.com/20/114' },
    },
  },
  {
    id: 'dua-yunus', surah: 21, fromAyah: 87, toAyah: 87, emoji: '🐋', title: 'Yūnus in the darkness — lā ilāha illā anta',
    context: {
      text: 'The call of Dhun-Nūn (Yūnus) from inside the whale. The Prophet ﷺ said: no Muslim ever supplicates with it for anything except that Allah answers him.',
      ref: { text: 'Tirmidhī 3505 (ṣaḥīḥ)', url: 'https://sunnah.com/tirmidhi:3505' },
    },
  },
  {
    id: 'dua-refuge-shayatin', surah: 23, fromAyah: 97, toAyah: 98, emoji: '🛡️', title: 'Refuge from the whispers of devils',
    context: {
      text: 'Allah taught His Prophet ﷺ these exact words of refuge — from the devils\' whispers and even from their presence.',
      ref: { text: 'Quran 23:97-98', url: 'https://quran.com/23/97' },
    },
  },
  {
    id: 'dua-forgive-mercy', surah: 23, fromAyah: 118, toAyah: 118, emoji: '💧', title: 'Forgive and have mercy — the best of the merciful',
    context: {
      text: 'The closing āyah of Sūrat al-Muʾminūn — the Quran ends the sūrah of the successful believers with this simple plea.',
      ref: { text: 'Quran 23:118', url: 'https://quran.com/23/118' },
    },
  },
  {
    id: 'dua-coolness-eyes', surah: 25, fromAyah: 74, toAyah: 74, emoji: '👨‍👩‍👧', title: 'Spouses & children — coolness of eyes',
    context: {
      text: 'One of the marks of ʿIbād ar-Raḥmān — the servants of the Most Merciful (25:63-77) — asking that one\'s own family become the delight of the eyes and that one lead the righteous.',
      ref: { text: 'Quran 25:63-77', url: 'https://quran.com/25/74' },
    },
  },
  {
    id: 'dua-musa-need', surah: 28, fromAyah: 24, toAyah: 24, emoji: '🌾', title: 'Mūsā — I am in need of whatever good You send',
    context: {
      text: 'Mūsā (as) — alone, penniless, a fugitive in Madyan — watered the two women\'s flock, then turned to the shade and said this. Provision, shelter, work and marriage followed within the same page.',
      ref: { text: 'Quran 28:22-28', url: 'https://quran.com/28/24' },
    },
  },
  {
    id: 'dua-offspring', surah: 3, fromAyah: 38, toAyah: 38, emoji: '🌱', title: 'Zakariyyā — grant me pure offspring',
    context: {
      text: 'Zakariyyā (as), moved by seeing Allah provide for Maryam, asked for a good child despite old age — and was given Yaḥyā while still standing in prayer.',
      ref: { text: 'Quran 3:37-39', url: 'https://quran.com/3/38' },
    },
  },
  {
    id: 'dua-patience-firmness', surah: 2, fromAyah: 250, toAyah: 250, emoji: '🏔️', title: 'Pour patience upon us, make our feet firm',
    context: {
      text: 'Said by Ṭālūt\'s small band of believers as they faced Jālūt\'s army — the duʿā of standing firm when outnumbered.',
      ref: { text: 'Quran 2:249-251', url: 'https://quran.com/2/250' },
    },
  },
];
