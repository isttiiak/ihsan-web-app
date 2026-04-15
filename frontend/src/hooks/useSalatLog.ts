import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export type PrayerStatus = 'prayed' | 'mosque' | 'kaza' | 'missed' | 'pending';
export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerEntry {
  status: PrayerStatus;
  loggedAt?: string;
}

export interface SalatLog {
  _id: string;
  userId: string;
  date: string;
  prayers: Record<PrayerId, PrayerEntry>;
}

export interface SalatLogResponse {
  ok: boolean;
  log: SalatLog;
}

export interface SalatAnalytics {
  totalDays: number;
  totalPrayers: number;
  prayedCount: number;
  mosqueCount: number;
  kazaCount: number;
  missedCount: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  perPrayer: Record<string, { prayed: number; mosque: number; kaza: number; missed: number }>;
  last7Days: Array<{ date: string; completed: number; total: number }>;
}

// Today's log
export function useSalatLog(date?: string) {
  return useQuery({
    queryKey: ['salat', 'log', date ?? 'today'],
    queryFn: async () => {
      const params = date ? `?date=${date}` : '';
      const { data } = await api.get<SalatLogResponse>(`/api/salat${params}`);
      return data.log;
    },
    staleTime: 60_000,
  });
}

// Mutation: update a single prayer status
export function useUpdatePrayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { prayer: PrayerId; status: PrayerStatus; date?: string }) => {
      const { data } = await api.patch<SalatLogResponse>('/api/salat/prayer', vars);
      return data.log;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['salat', 'log', vars.date ?? 'today'] });
      void qc.invalidateQueries({ queryKey: ['salat', 'analytics'] });
    },
  });
}

// Analytics
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
