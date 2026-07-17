import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { getTrackingDay } from '../utils/trackingDay.js';

export const QURAN_TOTAL_PAGES = 604;

/** Juz number for a mushaf page (standard Madani layout: juz 2 starts p.22, then every 20 pages) */
export function juzForPage(page: number): number {
  if (page < 22) return 1;
  return Math.min(30, Math.floor((page - 2) / 20) + 1);
}

export interface QuranSummary {
  profile: {
    dailyGoalPages: number;
    currentPage: number;
    khatmCount: number;
    totalPages: number;
  };
  todayPages: number;
  goalMet: boolean;
  streak: number;
  bestStreak: number;
  last7: Array<{ date: string; pages: number }>;
  stats: { last30Pages: number; allTimePages: number };
  pace: number | null;
  estDaysToKhatm: number | null;
}

// Fajr-boundary tracking day (falls back to civil midnight without a location)
export function localTodayStr(): string {
  return getTrackingDay();
}

export function useQuranSummary() {
  const user = useAuthStore((s) => s.user);
  const today = localTodayStr();
  return useQuery({
    queryKey: ['quran', 'summary', today],
    queryFn: async () => {
      const { data } = await api.get<QuranSummary & { ok: boolean }>(`/api/quran/summary?today=${today}`);
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useLogReading() {
  const qc = useQueryClient();
  const today = localTodayStr();
  return useMutation({
    mutationFn: async (vars: { pages: number; advancePosition: boolean }) => {
      const { data } = await api.post<{ ok: boolean; khatmCompleted: boolean }>('/api/quran/read', {
        date: today,
        pages: vars.pages,
        advancePosition: vars.advancePosition,
      });
      return data;
    },
    // Optimistic: bump today's pages (and the bookmark) immediately
    onMutate: async (vars) => {
      const key = ['quran', 'summary', today];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<QuranSummary>(key);
      qc.setQueryData<QuranSummary>(key, (old) => {
        if (!old) return old;
        const todayPages = old.todayPages + vars.pages;
        return {
          ...old,
          todayPages,
          goalMet: todayPages >= old.profile.dailyGoalPages,
          profile: {
            ...old.profile,
            currentPage: vars.advancePosition
              ? (old.profile.currentPage + Math.round(vars.pages)) % QURAN_TOTAL_PAGES
              : old.profile.currentPage,
          },
        };
      });
      return { previous, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['quran', 'summary'] });
    },
  });
}

export function useUpdateQuranProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { dailyGoalPages?: number; currentPage?: number }) => {
      const { data } = await api.patch('/api/quran/profile', vars);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['quran', 'summary'] });
    },
  });
}
