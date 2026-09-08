// Sunnah/nafl rak'ah guidance tied to each fard prayer — "what should I pray
// around this fard, and how many rak'ahs." Same AUTHENTICITY POLICY as
// postSalatQuran.ts: only ṣaḥīḥ/ḥasan narrations, and anything less than
// ṣaḥīḥ is graded plainly rather than presented as equally certain.
//
// muakkadah  = Sunnah Mu'akkadah — confirmed/emphasized, the Prophet ﷺ
//              prayed these consistently. The 12 rak'ah "rawātib" set
//              (4+2 Dhuhr, 2 Maghrib, 2 Isha, 2 Fajr) comes from one hadith
//              (Umm Ḥabībah, Ṣaḥīḥ Muslim 728 / Jāmiʿ at-Tirmidhī 415):
//              "Whoever prays twelve rak'ahs during a day and a night, a
//              house will be built for him in Paradise."
// ghairMuakkadah = recommended but not confirmed/emphasized the same way —
//              authentically reported, but either a lighter narration
//              ("for whoever wishes") or not part of the 12-rak'ah set.

import type { PrayerId } from '../hooks/useSalatLog.js';

export type SunnahEmphasis = 'muakkadah' | 'ghairMuakkadah';

export interface SunnahSlot {
  rakat: number;
  emphasis: SunnahEmphasis;
  note: string;
  source: string;
  sourceUrl: string;
  grade: string;
}

export interface PrayerSunnahGuide {
  fardRakat: number;
  before?: SunnahSlot;
  after?: SunnahSlot;
}

export const SUNNAH_GUIDE: Partial<Record<PrayerId, PrayerSunnahGuide>> = {
  fajr: {
    fardRakat: 2,
    before: {
      rakat: 2,
      emphasis: 'muakkadah',
      note: 'The most emphasized of all the rawātib — never left even on a journey.',
      source: 'Ṣaḥīḥ Muslim 725',
      sourceUrl: 'https://sunnah.com/muslim:725',
      grade: 'Ṣaḥīḥ — "better than the world and everything in it"',
    },
  },
  dhuhr: {
    fardRakat: 4,
    before: {
      rakat: 4,
      emphasis: 'muakkadah',
      note: "Part of the Prophet's ﷺ twelve daily rawātib.",
      source: 'Ṣaḥīḥ Muslim 728',
      sourceUrl: 'https://sunnah.com/muslim:728',
      grade: 'Ṣaḥīḥ',
    },
    after: {
      rakat: 2,
      emphasis: 'muakkadah',
      note: "Part of the Prophet's ﷺ twelve daily rawātib.",
      source: 'Ṣaḥīḥ Muslim 728',
      sourceUrl: 'https://sunnah.com/muslim:728',
      grade: 'Ṣaḥīḥ',
    },
  },
  asr: {
    fardRakat: 4,
    before: {
      rakat: 4,
      emphasis: 'ghairMuakkadah',
      note: 'Recommended, not among the confirmed twelve — a lighter emphasis than the Dhuhr/Fajr rawātib.',
      source: 'Jāmiʿ at-Tirmidhī 430',
      sourceUrl: 'https://sunnah.com/tirmidhi:430',
      grade: 'Ḥasan — "May Allah have mercy on one who prays four before ʿAṣr"',
    },
  },
  maghrib: {
    fardRakat: 3,
    before: {
      rakat: 2,
      emphasis: 'ghairMuakkadah',
      note: 'The Prophet ﷺ said it three times then added "for whoever wishes" — genuinely optional, not a fixed rawātib slot.',
      source: 'Ṣaḥīḥ al-Bukhārī 1183',
      sourceUrl: 'https://sunnah.com/bukhari:1183',
      grade: 'Ṣaḥīḥ',
    },
    after: {
      rakat: 2,
      emphasis: 'muakkadah',
      note: "Part of the Prophet's ﷺ twelve daily rawātib.",
      source: 'Ṣaḥīḥ Muslim 728',
      sourceUrl: 'https://sunnah.com/muslim:728',
      grade: 'Ṣaḥīḥ',
    },
  },
  isha: {
    fardRakat: 4,
    after: {
      rakat: 2,
      emphasis: 'muakkadah',
      note: "Part of the Prophet's ﷺ twelve daily rawātib — Witr comes after this, separately (see the Witr reminder below).",
      source: 'Ṣaḥīḥ Muslim 728',
      sourceUrl: 'https://sunnah.com/muslim:728',
      grade: 'Ṣaḥīḥ',
    },
  },
};
