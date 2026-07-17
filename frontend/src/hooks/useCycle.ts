import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { getTrackingDay } from '../utils/trackingDay.js';

export interface CycleActive {
  type: 'hayd' | 'nifas';
  startDate: string;
  dayCount: number;
  maxDays: number;
  beyondMax: boolean;
}

export interface CycleSummary {
  active: CycleActive | null;
  prediction: {
    nextStart: string | null;
    avgCycleDays: number;
    avgPeriodDays: number;
    basedOnCycles: number;
  };
  madhab: 'hanafi' | 'majority';
  logs: Array<{ _id: string; type: 'hayd' | 'nifas'; startDate: string; endDate: string | null }>;
}

/** True for signed-in female users — the only ones who see Rayhanah UI. */
export function useIsFemale(): boolean {
  const user = useAuthStore((s) => s.user);
  return user?.gender === 'female';
}

export function useCycleSummary(enabled = true) {
  const user = useAuthStore((s) => s.user);
  const isFemale = useIsFemale();
  const today = getTrackingDay();
  return useQuery({
    queryKey: ['cycle', 'summary', today],
    queryFn: async () => {
      const { data } = await api.get<CycleSummary & { ok: boolean }>(
        `/api/cycle/summary?today=${today}`
      );
      return data;
    },
    enabled: !!user && isFemale && enabled,
    staleTime: 60_000,
  });
}

/** Just the active state — for Salat/Fasting/Home excused checks. */
export function useCycleActive(): CycleActive | null {
  const { data } = useCycleSummary();
  return data?.active ?? null;
}

export function useStartCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { date: string; type: 'hayd' | 'nifas' }) => {
      const { data } = await api.post('/api/cycle/start', vars);
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cycle'] }),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Could not save — try again.', { id: 'cycle-start' });
    },
  });
}

export function useEndCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { date: string }) => {
      const { data } = await api.post('/api/cycle/end', vars);
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cycle'] }),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Could not save — try again.', { id: 'cycle-end' });
    },
  });
}

export function useSetMadhab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (madhab: 'hanafi' | 'majority') => {
      const { data } = await api.patch('/api/cycle/profile', { madhab });
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cycle'] }),
    onError: () => toast.error('Could not update setting.', { id: 'cycle-madhab' }),
  });
}

export function useDeleteCycleLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string) => {
      await api.delete(`/api/cycle/logs/${logId}`);
      return logId;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cycle'] }),
    onError: () => toast.error('Could not delete entry.', { id: 'cycle-del' }),
  });
}
