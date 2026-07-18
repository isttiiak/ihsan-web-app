// The curated zikr library (Istiak's plan): categorized, hadith-verified
// adhkār that users ADD to their own counter list from Settings — the
// database defaults stay untouched. Every reference links to sunnah.com
// with the exact number; grades below ṣaḥīḥ are noted.

export interface LibraryZikr {
  /** The counter key — what appears in the dropdown when added */
  name: string;
  arabic: string;
  meaning: string;
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

export const ZIKR_LIBRARY: ZikrCategory[] = [
  {
    id: 'tasbih',
    title: 'Tasbīḥ & praise',
    emoji: '📿',
    blurb: 'The everyday polish of the heart.',
    items: [
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
      {
        name: 'Alhamdulillah',
        arabic: 'الْحَمْدُ لِلَّهِ',
        meaning: 'All praise is due to Allah',
        virtue: '"Alḥamdulillāh fills the Scale."',
        source: 'Muslim 223', sourceUrl: 'https://sunnah.com/muslim:223',
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
        name: 'Astaghfirullah wa atubu ilayh',
        arabic: 'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',
        meaning: 'I seek the forgiveness of Allah and repent to Him',
        virtue: 'The Prophet ﷺ said it more than seventy times a day.',
        source: 'Bukhārī 6307', sourceUrl: 'https://sunnah.com/bukhari:6307',
      },
      {
        name: 'Sayyidul-Istighfar',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ…',
        meaning: 'The master supplication of forgiveness (Allahumma anta Rabbī…)',
        virtue: 'Said with conviction in the day or night — Paradise for the one who dies upon it.',
        source: 'Bukhārī 6306', sourceUrl: 'https://sunnah.com/bukhari:6306',
      },
      {
        name: 'Astaghfirullahal-Azim',
        arabic: 'أَسْتَغْفِرُ اللهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
        meaning: 'I seek forgiveness of Allah the Magnificent, none has the right to be worshipped but He, the Ever-Living, the Sustainer, and I repent to Him',
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
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ…',
        meaning: 'The complete ṣalawāt recited in every salat (as taught in tashahhud)',
        source: 'Bukhārī 3370', sourceUrl: 'https://sunnah.com/bukhari:3370',
      },
      {
        name: 'Salli wa sallim ala Nabiyyina Muhammad',
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
