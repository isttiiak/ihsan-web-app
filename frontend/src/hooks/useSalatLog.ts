import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export type PrayerStatus = 'completed' | 'kaza' | 'missed' | 'pending';
export type PrayerLocation = 'home' | 'mosque' | 'jamat';
export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerEntry {
  status: PrayerStatus;
  prayedAt?: string;
  location?: PrayerLocation;
  tasbeeh?: boolean;
}

export interface SalatLog {
  _id: string;
  userId: string;
  date: string;
  prayers: Record<PrayerId, PrayerEntry>;
}

export interface UpdatePrayerVars {
  prayer: PrayerId;
  status: PrayerStatus;
  date?: string;
  location?: PrayerLocation;
  tasbeeh?: boolean;
}

export interface SalatAnalytics {
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

/** Get (or lazy-create) the salat log for a given date */
export function useSalatLog(date?: string) {
  return useQuery({
    queryKey: ['salat', 'log', date ?? 'today'],
    queryFn: async () => {
      const params = date ? `?date=${date}` : '';
      const { data } = await api.get<{ ok: boolean; log: SalatLog }>(`/api/salat${params}`);
      return data.log;
    },
    staleTime: 30_000,
    placeholderData: {
      _id: '',
      userId: '',
      date: date ?? new Date().toISOString().substring(0, 10),
      prayers: EMPTY_PRAYERS,
    },
  });
}

/** Update a single prayer with optimistic UI update */
export function useUpdatePrayer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: UpdatePrayerVars) => {
      const { data } = await api.patch<{ ok: boolean; log: SalatLog }>('/api/salat/prayer', vars);
      return data.log;
    },

    // Optimistic update — apply immediately, roll back on error
    onMutate: async (vars) => {
      const key = ['salat', 'log', vars.date ?? 'today'];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<SalatLog>(key);

      qc.setQueryData<SalatLog>(key, (old) => {
        if (!old) return old;
        const updated: SalatLog = {
          ...old,
          prayers: {
            ...old.prayers,
            [vars.prayer]: {
              status: vars.status,
              prayedAt: vars.status !== 'pending' ? new Date().toISOString() : undefined,
              location: (vars.status === 'completed' || vars.status === 'kaza')
                ? (vars.location ?? 'home')
                : undefined,
              tasbeeh: (vars.status === 'completed' || vars.status === 'kaza')
                ? (vars.tasbeeh ?? false)
                : false,
            },
          },
        };
        return updated;
      });

      return { previous, key };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(context.key, context.previous);
      }
    },

    onSettled: (_data, _err, vars) => {
      void qc.invalidateQueries({ queryKey: ['salat', 'log', vars.date ?? 'today'] });
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
    staleTime: 60_000,
  });
}
