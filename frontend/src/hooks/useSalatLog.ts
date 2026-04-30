import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export type PrayerStatus = 'completed' | 'kaza' | 'missed' | 'pending';
export type PrayerLocation = 'home' | 'mosque' | 'jamat';
export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const NAFL_TYPE_IDS = [
  'tahajjud', 'ishraq', 'duha', 'awwabin', 'witr',
  'tahiyyat_wudu', 'tahiyyat_masjid', 'hajat', 'istikharah', 'tarawih',
] as const;
export type NaflType = (typeof NAFL_TYPE_IDS)[number];

export interface NaflTypeMeta {
  id: NaflType;
  label: string;
  arabic: string;
  emoji: string;
  shortNote: string;
  fullNote: string;
  hadith: string;
  hadithUrl: string;
  defaultRakat: number;
}

export const NAFL_TYPE_META: NaflTypeMeta[] = [
  {
    id: 'tahajjud',
    label: 'Tahajjud',
    arabic: 'التهجد',
    emoji: '🌙',
    shortNote: 'Night prayer — last third of night',
    fullNote: 'The most virtuous voluntary prayer after the obligatory. 2–12 rak\'ahs. Finish with Witr.',
    hadith: '"The best prayer after the obligatory prayers is the night prayer." — Ṣaḥīḥ Muslim 1163',
    hadithUrl: 'https://sunnah.com/muslim:1163',
    defaultRakat: 2,
  },
  {
    id: 'ishraq',
    label: 'Ishraq',
    arabic: 'الإشراق',
    emoji: '🌅',
    shortNote: '~20 min after sunrise',
    fullNote: '"Whoever prays Fajr in congregation, sits remembering Allah until sunrise, then prays two rak\'ahs — reward like Ḥajj and \'Umrah, complete, complete, complete."',
    hadith: 'Tirmidhī 586',
    hadithUrl: 'https://sunnah.com/tirmidhi:586',
    defaultRakat: 2,
  },
  {
    id: 'duha',
    label: 'Duha (Chasht)',
    arabic: 'الضحى',
    emoji: '☀️',
    shortNote: 'Mid-morning, min 2 rak\'ahs (4+ preferred)',
    fullNote: 'Minimum 2 rak\'ahs; 4 is preferred in the Ḥanafī school. "The Prophet ﷺ used to pray Duha four rak\'ahs and would add more as Allah willed." Maximum is 12.',
    hadith: 'Ṣaḥīḥ Muslim 717',
    hadithUrl: 'https://sunnah.com/muslim:717',
    defaultRakat: 2,
  },
  {
    id: 'awwabin',
    label: 'Awwabin',
    arabic: 'الأوابين',
    emoji: '⭐',
    shortNote: '2–6 rak\'ahs after Maghrib',
    fullNote: 'Prayed between Maghrib and Isha. For those who frequently return (awwāb) to Allah.',
    hadith: 'Ibn Mājah 1167',
    hadithUrl: 'https://sunnah.com/ibnmajah:1167',
    defaultRakat: 6,
  },
  {
    id: 'witr',
    label: 'Witr',
    arabic: 'الوتر',
    emoji: '🕯️',
    shortNote: 'After Isha — odd rak\'ahs',
    fullNote: 'Highly recommended (wājib in Ḥanafī school). Prayed after Isha, before Fajr. Usually 3 rak\'ahs with Qunūt du\'a.',
    hadith: '"Make Witr the last of your night prayers." — Ṣaḥīḥ al-Bukhārī 998',
    hadithUrl: 'https://sunnah.com/bukhari:998',
    defaultRakat: 2,
  },
  {
    id: 'tahiyyat_wudu',
    label: "Tahiyyat al-Wudu'",
    arabic: 'تحية الوضوء',
    emoji: '💧',
    shortNote: '2 rak\'ahs after wudu',
    fullNote: 'Bilāl (RA) was asked about his deed in Paradise. He said: "I do not do anything except that whenever I perform wudu, I pray two rak\'ahs."',
    hadith: 'Ṣaḥīḥ al-Bukhārī 1149',
    hadithUrl: 'https://sunnah.com/bukhari:1149',
    defaultRakat: 2,
  },
  {
    id: 'tahiyyat_masjid',
    label: 'Tahiyyat al-Masjid',
    arabic: 'تحية المسجد',
    emoji: '🕌',
    shortNote: '2 rak\'ahs upon entering mosque',
    fullNote: '"When one of you enters the mosque, let him not sit until he has prayed two rak\'ahs." Do not sit before praying them.',
    hadith: 'Ṣaḥīḥ Muslim 714',
    hadithUrl: 'https://sunnah.com/muslim:714',
    defaultRakat: 2,
  },
  {
    id: 'hajat',
    label: "Ṣalāt al-Ḥājat",
    arabic: 'صلاة الحاجة',
    emoji: '🤲',
    shortNote: '2 rak\'ahs for a need',
    fullNote: '"Whoever has a need with Allah or any human being, let him perform wudu, pray two rak\'ahs, then praise Allah, send blessings upon the Prophet ﷺ, then make du\'a."',
    hadith: 'Sunan Ibn Mājah 1384',
    hadithUrl: 'https://sunnah.com/ibnmajah:1384',
    defaultRakat: 2,
  },
  {
    id: 'istikharah',
    label: 'Istikharah',
    arabic: 'الاستخارة',
    emoji: '🎯',
    shortNote: '2 rak\'ahs for guidance',
    fullNote: '"The Prophet ﷺ used to teach us Istikharah for all our affairs as he would teach a surah of the Qur\'an." Pray two rak\'ahs then recite the Istikharah du\'a.',
    hadith: 'Ṣaḥīḥ al-Bukhārī 1162',
    hadithUrl: 'https://sunnah.com/bukhari:1162',
    defaultRakat: 2,
  },
  {
    id: 'tarawih',
    label: 'Tarawih',
    arabic: 'التراويح',
    emoji: '🌙',
    shortNote: 'Ramadan night prayers',
    fullNote: '8 or 20 rak\'ahs after Isha in Ramadan. "Whoever prays in Ramadan with faith and seeking reward, his past sins are forgiven."',
    hadith: 'Ṣaḥīḥ al-Bukhārī 37',
    hadithUrl: 'https://sunnah.com/bukhari:37',
    defaultRakat: 8,
  },
];

export interface PrayerEntry {
  status: PrayerStatus;
  prayedAt?: string;
  location?: PrayerLocation;
  tasbeeh?: boolean;
  ayatulKursi?: boolean;
}

export interface NaflEntry {
  completed: boolean;
  types: NaflType[];
  rakat: number;
  completedAt?: string;
}

export interface SalatLog {
  _id: string;
  userId: string;
  date: string;
  prayers: Record<PrayerId, PrayerEntry>;
  nafl: NaflEntry;
}

export interface UpdatePrayerVars {
  prayer: PrayerId;
  status: PrayerStatus;
  date?: string;
  location?: PrayerLocation;
  tasbeeh?: boolean;
  ayatulKursi?: boolean;
}

export interface UpdateNaflVars {
  completed: boolean;
  types: NaflType[];
  rakat: number;
  date?: string;
}

export interface SalatAnalytics {
  periodDays: number;
  totalDays: number;
  totalPossiblePrayers: number;
  completedCount: number;
  kazaCount: number;
  missedCount: number;
  prayedTotal: number;
  mosqueCount: number;
  jamaatCount: number;
  homeCount: number;
  tasbeehCount: number;
  naflDays: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  perPrayer: Record<string, {
    completed: number; kaza: number; missed: number; pending: number;
    mosque: number; jamat: number; tasbeeh: number;
  }>;
  last7Days: Array<{ date: string; completed: number; total: number }>;
  calendarData: Array<{ date: string; completed: number; total: number }>;
}

const EMPTY_PRAYERS: Record<PrayerId, PrayerEntry> = {
  fajr: { status: 'pending' },
  dhuhr: { status: 'pending' },
  asr: { status: 'pending' },
  maghrib: { status: 'pending' },
  isha: { status: 'pending' },
};

const EMPTY_NAFL: NaflEntry = { completed: false, types: [], rakat: 2 };

// Always use local device date — never let the backend guess (backend runs UTC which
// diverges from local date for users ahead/behind UTC).
function localTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useSalatLog(date?: string) {
  const resolvedDate = date ?? localTodayStr();
  return useQuery({
    queryKey: ['salat', 'log', resolvedDate],
    queryFn: async () => {
      const { data } = await api.get<{ ok: boolean; log: SalatLog }>(`/api/salat?date=${resolvedDate}`);
      return data.log;
    },
    staleTime: 60_000,
    placeholderData: {
      _id: '',
      userId: '',
      date: resolvedDate,
      prayers: EMPTY_PRAYERS,
      nafl: EMPTY_NAFL,
    },
  });
}

export function useUpdatePrayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: UpdatePrayerVars) => {
      const { data } = await api.patch<{ ok: boolean; log: SalatLog }>('/api/salat/prayer', vars);
      return data.log;
    },
    onMutate: async (vars) => {
      const key = ['salat', 'log', vars.date ?? localTodayStr()];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<SalatLog>(key);
      qc.setQueryData<SalatLog>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          prayers: {
            ...old.prayers,
            [vars.prayer]: {
              status: vars.status,
              prayedAt: vars.status !== 'pending' ? new Date().toISOString() : undefined,
              location: (vars.status === 'completed' || vars.status === 'kaza')
                ? (vars.location ?? 'home') : undefined,
              tasbeeh: (vars.status === 'completed' || vars.status === 'kaza')
                ? (vars.tasbeeh ?? false) : false,
              ayatulKursi: (vars.status === 'completed' || vars.status === 'kaza')
                ? (vars.ayatulKursi ?? false) : false,
            },
          },
        };
      });
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) qc.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _err, vars) => {
      void qc.invalidateQueries({ queryKey: ['salat', 'log', vars.date ?? localTodayStr()] });
      void qc.invalidateQueries({ queryKey: ['salat', 'analytics'] });
    },
  });
}

export function useUpdateNafl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: UpdateNaflVars) => {
      const { data } = await api.patch<{ ok: boolean; log: SalatLog }>('/api/salat/nafl', vars);
      return data.log;
    },
    onMutate: async (vars) => {
      const key = ['salat', 'log', vars.date ?? localTodayStr()];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<SalatLog>(key);
      qc.setQueryData<SalatLog>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          nafl: {
            completed: vars.completed,
            types: vars.types,
            rakat: vars.rakat,
            completedAt: vars.completed ? new Date().toISOString() : undefined,
          },
        };
      });
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) qc.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _err, vars) => {
      void qc.invalidateQueries({ queryKey: ['salat', 'log', vars.date ?? localTodayStr()] });
      void qc.invalidateQueries({ queryKey: ['salat', 'analytics'] });
    },
  });
}

export function useSalatAnalytics(days = 30) {
  return useQuery({
    queryKey: ['salat', 'analytics', days],
    queryFn: async () => {
      const { data } = await api.get<SalatAnalytics & { ok: boolean }>(`/api/salat/analytics?days=${days}`);
      return data;
    },
    staleTime: 5 * 60_000,
  });
}
