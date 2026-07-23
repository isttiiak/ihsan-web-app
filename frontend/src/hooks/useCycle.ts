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

export type CycleFlow = 'light' | 'medium' | 'heavy';
export type CycleMood = 'calm' | 'happy' | 'low' | 'irritable' | 'anxious' | 'tired';

export interface CycleDayNote {
  date: string;
  flow: CycleFlow | null;
  symptoms: string[];
  moods: CycleMood[];
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
  days: CycleDayNote[];
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

/** Backfill a completed past episode (history import). */
export function useAddPastCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { startDate: string; endDate: string; type: 'hayd' | 'nifas' }) => {
      const { data } = await api.post('/api/cycle/logs', { ...vars, today: getTrackingDay() });
      return data;
    },
    onSuccess: () => {
      toast.success('Past cycle added — predictions just got smarter 🌸', { id: 'cycle-past' });
      void qc.invalidateQueries({ queryKey: ['cycle'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Could not add that cycle.', { id: 'cycle-past' });
    },
  });
}

/** Save today's wellness note (flow / symptoms / mood) — optimistic, silent. */
export function useUpsertCycleDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { date: string; flow?: CycleFlow | null; symptoms?: string[]; moods?: CycleMood[] }) => {
      const { data } = await api.put('/api/cycle/day', vars);
      return data;
    },
    onMutate: async (vars) => {
      // Optimistic merge into every cached cycle summary
      await qc.cancelQueries({ queryKey: ['cycle'] });
      qc.setQueriesData<CycleSummary & { ok: boolean }>({ queryKey: ['cycle', 'summary'] }, (old) => {
        if (!old) return old;
        const days = [...(old.days ?? [])];
        const i = days.findIndex((d) => d.date === vars.date);
        const prev = i >= 0 ? days[i]! : { date: vars.date, flow: null, symptoms: [], moods: [] };
        const next = {
          ...prev,
          ...(vars.flow !== undefined ? { flow: vars.flow } : {}),
          ...(vars.symptoms !== undefined ? { symptoms: vars.symptoms } : {}),
          ...(vars.moods !== undefined ? { moods: vars.moods } : {}),
        };
        if (i >= 0) days[i] = next; else days.push(next);
        return { ...old, days };
      });
    },
    onError: () => {
      toast.error('Could not save your note — try again.', { id: 'cycle-day' });
      void qc.invalidateQueries({ queryKey: ['cycle'] });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['cycle', 'summary'] }),
  });
}

/** Edit an episode's dates, or endDate:null to REOPEN it ("I'm not done
 * yet") — daily wellness notes are untouched either way. */
export function useEditCycleLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { logId: string; startDate?: string; endDate?: string | null }) => {
      const { logId, ...body } = vars;
      const { data } = await api.patch(`/api/cycle/logs/${logId}`, body);
      return data as { ok: boolean };
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cycle'] }),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Could not update the cycle — try again.', { id: 'cycle-edit' });
    },
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
