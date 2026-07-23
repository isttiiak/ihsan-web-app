// The curated zikr library (Istiak's plan): categorized, hadith-verified
// adhkār that users ADD to their own counter list from Settings — the
// database defaults stay untouched. Every reference links to sunnah.com
// with the exact number; grades below ṣaḥīḥ are noted.
//
// For LONG adhkār `arabic`/`meaning` hold the FULL text (shown in the
// expandable reference card under the counter), while `shortArabic` /
// `shortMeaning` are the compact versions the counter card displays.

export interface LibraryZikr {
  /** The counter key — what appears in the dropdown when added */
  name: string;
  /** FULL Arabic text (complete, never truncated) */
  arabic: string;
  /** FULL meaning */
  meaning: string;
  /** Compact Arabic for the counter card (falls back to `arabic`) */
  shortArabic?: string;
  /** Compact meaning for the counter card (falls back to `meaning`) */
  shortMeaning?: string;
  source: string;
  sourceUrl: string;
  grade?: string;
  virtue?: string;
}

export interface ZikrCategory {
  id: string;
  title: string;
  emoji: string;
  blurb: string;
  items: LibraryZikr[];
}

/** The counter's built-in dhikr — stored app-side, merged on every mount.
 * Shared so the Settings library never mistakes them for user customs. */
export const PREDEFINED_TYPES = [
  'SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah',
  'Astaghfirullah', 'SubhanAllah wa bihamdihi', 'La hawla wa la quwwata illa billah',
  'SubhanAllah wal hamdulillah wa la ilaha illAllah wa Allahu akbar',
  'Ayatul Kursi', 'Durud Ibrahim',
];

/** Earlier names of renamed library items — still recognized as
 * library-owned so they never show up as "your custom additions". */
export const LEGACY_LIBRARY_NAMES = [
  'Salli wa sallim ala Nabiyyina Muhammad',
];

export const ZIKR_LIBRARY: ZikrCategory[] = [
  {
    id: 'tasbih',
    title: 'Tasbīḥ & praise',
    emoji: '📿',
    blurb: 'The everyday polish of the heart.',
    items: [
      {
        name: 'SubhanAllah',
        arabic: 'سُبْحَانَ اللهِ',
        meaning: 'Glory be to Allah — exalting Him above every imperfection',
        virtue: '100 tasbīḥs — a thousand good deeds recorded, or a thousand sins erased.',
        source: 'Muslim 2698', sourceUrl: 'https://sunnah.com/muslim:2698',
      },
      {
        name: 'Alhamdulillah',
        arabic: 'الْحَمْدُ لِلَّهِ',
        meaning: 'All praise is due to Allah',
        virtue: '"Alḥamdulillāh fills the Scale."',
        source: 'Muslim 223', sourceUrl: 'https://sunnah.com/muslim:223',
      },
      {
        name: 'Allahu Akbar',
        arabic: 'اللهُ أَكْبَرُ',
        meaning: 'Allah is the Greatest — greater than everything that occupies the heart',
        virtue: 'One of the four most beloved words to Allah.',
        source: 'Muslim 2137', sourceUrl: 'https://sunnah.com/muslim:2137',
      },
      {
        name: 'SubhanAllah wa bihamdihi',
        arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
        meaning: 'Glory be to Allah and praise Him',
        virtue: '100× a day — sins wiped away even if like the foam of the sea.',
        source: 'Bukhārī 6405', sourceUrl: 'https://sunnah.com/bukhari:6405',
      },
      {
        name: 'SubhanAllahil-Azim wa bihamdihi',
        arabic: 'سُبْحَانَ اللهِ الْعَظِيمِ وَبِحَمْدِهِ',
        meaning: 'Glory be to Allah the Magnificent, and praise Him',
        virtue: 'Two phrases light on the tongue, heavy on the Scale, beloved to ar-Raḥmān.',
        source: 'Bukhārī 6682', sourceUrl: 'https://sunnah.com/bukhari:6682',
      },
      {
        name: "SubhanAllahi 'adada khalqihi",
        arabic: 'سُبْحَانَ اللهِ عَدَدَ خَلْقِهِ',
        meaning: 'Glory be to Allah as many times as the number of His creation',
        virtue: 'Taught to Juwayriyah (ra) — words that outweigh hours of dhikr.',
        source: 'Muslim 2726', sourceUrl: 'https://sunnah.com/muslim:2726',
      },
    ],
  },
  {
    id: 'istighfar',
    title: 'Istighfār — seeking forgiveness',
    emoji: '🌧️',
    blurb: 'Many doors to the same mercy — each with its own words.',
    items: [
      {
        name: 'Astaghfirullah',
        arabic: 'أَسْتَغْفِرُ اللهَ',
        meaning: 'I seek the forgiveness of Allah',
        virtue: 'The Prophet ﷺ sought forgiveness a hundred times a day.',
        source: 'Muslim 2702', sourceUrl: 'https://sunnah.com/muslim:2702',
      },
      {
        name: 'Astaghfirullah wa atubu ilayh',
        arabic: 'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',
        meaning: 'I seek the forgiveness of Allah and repent to Him',
        virtue: 'The Prophet ﷺ said it more than seventy times a day.',
        source: 'Bukhārī 6307', sourceUrl: 'https://sunnah.com/bukhari:6307',
      },
      {
        name: 'Sayyidul-Istighfar',
        arabic:
          'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
        meaning:
          'O Allah, You are my Lord — none has the right to be worshipped but You. You created me and I am Your slave, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge before You Your blessing upon me, and I acknowledge my sin — so forgive me, for none forgives sins but You.',
        shortArabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ…',
        shortMeaning: 'The master supplication of forgiveness — expand below for the full words',
        virtue: 'Said with conviction in the day or night — Paradise for the one who dies upon it.',
        source: 'Bukhārī 6306', sourceUrl: 'https://sunnah.com/bukhari:6306',
      },
      {
        name: 'Astaghfirullahal-Azim',
        arabic: 'أَسْتَغْفِرُ اللهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
        meaning: 'I seek forgiveness of Allah the Magnificent, none has the right to be worshipped but He, the Ever-Living, the Sustainer, and I repent to Him',
        shortArabic: 'أَسْتَغْفِرُ اللهَ الْعَظِيمَ…',
        shortMeaning: 'I seek forgiveness of Allah the Magnificent — expand below for the full words',
        virtue: 'Forgiven — even one who fled from battle.',
        source: 'Abū Dāwūd 1517', sourceUrl: 'https://sunnah.com/abudawud:1517',
        grade: 'Ṣaḥīḥ (al-Albānī)',
      },
    ],
  },
  {
    id: 'salawat',
    title: 'Ṣalawāt upon the Prophet ﷺ',
    emoji: '💚',
    blurb: 'One ṣalawāt from you — ten from Allah upon you (Muslim 408).',
    items: [
      {
        name: 'Durud Ibrahim',
        arabic:
          'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
        meaning:
          'O Allah, send Your mercy upon Muhammad and the family of Muhammad, as You sent Your mercy upon Ibrāhīm and the family of Ibrāhīm; You are indeed Praiseworthy, Most Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrāhīm and the family of Ibrāhīm; You are indeed Praiseworthy, Most Glorious.',
        shortArabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ…',
        shortMeaning: 'The complete ṣalawāt recited in every salat — expand below for the full words',
        source: 'Bukhārī 3370', sourceUrl: 'https://sunnah.com/bukhari:3370',
      },
      {
        name: 'Allahumma salli wa sallim ala Nabiyyina Muhammad',
        arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
        meaning: 'O Allah, send prayers and peace upon our Prophet Muhammad — the short ṣalawāt for constant repetition',
        source: 'Ḥiṣn al-Muslim 98', sourceUrl: 'https://sunnah.com/hisn:98',
      },
    ],
  },
  {
    id: 'kalimat',
    title: 'The weighty words',
    emoji: '⚖️',
    blurb: 'Short sentences the Prophet ﷺ called treasures.',
    items: [
      {
        name: 'La ilaha illallah',
        arabic: 'لَا إِلَهَ إِلَّا اللهُ',
        meaning: 'There is no god but Allah',
        virtue: 'The best of remembrance.',
        source: 'Tirmidhī 3383', sourceUrl: 'https://sunnah.com/tirmidhi:3383',
        grade: 'Ḥasan',
      },
      {
        name: 'La ilaha illallahu wahdahu la sharika lah',
        arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        meaning: 'None has the right to be worshipped but Allah alone, without partner; His is the dominion and the praise, and He is able to do all things',
        shortArabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ…',
        shortMeaning: 'None has the right to be worshipped but Allah alone, without partner…',
        virtue: '100× a day — like freeing ten slaves, a hundred good deeds, protection from Shayṭān.',
        source: 'Bukhārī 3293', sourceUrl: 'https://sunnah.com/bukhari:3293',
      },
      {
        name: 'La hawla wa la quwwata illa billah',
        arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
        meaning: 'There is no power nor might except with Allah',
        virtue: 'A treasure from the treasures of Paradise.',
        source: 'Bukhārī 4205', sourceUrl: 'https://sunnah.com/bukhari:4205',
      },
      {
        name: "HasbunAllahu wa ni'mal-wakil",
        arabic: 'حَسْبُنَا اللهُ وَنِعْمَ الْوَكِيلُ',
        meaning: 'Allah is sufficient for us, and the best Disposer of affairs',
        virtue: 'Said by Ibrāhīm (as) in the fire and by the Prophet ﷺ when facing armies.',
        source: 'Bukhārī 4563', sourceUrl: 'https://sunnah.com/bukhari:4563',
      },
    ],
  },
  {
    id: 'asma',
    title: 'Calling on His Names',
    emoji: '✨',
    blurb: 'Duʿā-dhikr built on al-Asmāʾ al-Ḥusnā (Bukhārī 2736).',
    items: [
      {
        name: 'Ya Hayyu Ya Qayyum',
        arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
        meaning: 'O Ever-Living, O Sustainer — by Your mercy I seek relief',
        virtue: 'The Prophet ﷺ said it in times of distress.',
        source: 'Tirmidhī 3524', sourceUrl: 'https://sunnah.com/tirmidhi:3524',
        grade: 'Ḥasan',
      },
      {
        name: 'Ya Dhal-Jalali wal-Ikram',
        arabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        meaning: 'O Possessor of Majesty and Honour',
        virtue: '"Hold fast to (this)" — the Prophet ﷺ commanded.',
        source: 'Tirmidhī 3525', sourceUrl: 'https://sunnah.com/tirmidhi:3525',
        grade: 'Ḥasan',
      },
    ],
  },
  {
    id: 'protection',
    title: 'Morning · evening · protection',
    emoji: '🛡️',
    blurb: 'The daily fortress.',
    items: [
      {
        name: 'Bismillahilladhi la yadurru',
        arabic: 'بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        meaning: 'In the name of Allah with whose name nothing on earth or in heaven can harm; He is the All-Hearing, All-Knowing',
        shortArabic: 'بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ…',
        shortMeaning: 'In the name of Allah with whose name nothing can harm…',
        virtue: '3× morning and evening — nothing will harm you.',
        source: 'Tirmidhī 3388', sourceUrl: 'https://sunnah.com/tirmidhi:3388',
        grade: 'Ḥasan ṣaḥīḥ',
      },
      {
        name: "A'udhu bikalimatillahit-tammat",
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        meaning: 'I seek refuge in the perfect words of Allah from the evil of what He created',
        virtue: 'Nothing harms the one who says it in the evening.',
        source: 'Muslim 2708', sourceUrl: 'https://sunnah.com/muslim:2708',
      },
    ],
  },
];

/** Look up a library item by its counter name (case-insensitive), including
 * legacy names of renamed entries. */
export function findLibraryZikr(name: string): LibraryZikr | null {
  const lower = name.toLowerCase();
  for (const cat of ZIKR_LIBRARY) {
    for (const item of cat.items) {
      if (item.name.toLowerCase() === lower) return item;
    }
  }
  // Legacy: the short salawat was renamed to include "Allahumma"
  if (lower === 'salli wa sallim ala nabiyyina muhammad') {
    return findLibraryZikr('Allahumma salli wa sallim ala Nabiyyina Muhammad');
  }
  return null;
}
