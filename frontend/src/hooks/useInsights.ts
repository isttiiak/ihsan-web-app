import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';

export interface WorshipGroup {
  days: number;
  avgSalatCompletionPct: number | null;
  avgZikrCount: number | null;
  avgQuranUnits: number | null;
}

export interface WorshipCorrelation {
  windowDays: number;
  fastingDays: WorshipGroup;
  nonFastingDays: WorshipGroup;
  insufficientData: boolean;
}

function localTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Compares worship consistency on fasting vs. non-fasting days over the
 * same window — salat completion, zikr count, Quran reading. */
export function useWorshipCorrelation(days = 90) {
  const user = useAuthStore((s) => s.user);
  const today = localTodayStr();
  const timezoneOffset = -new Date().getTimezoneOffset();
  return useQuery({
    queryKey: ['insights', 'worshipCorrelation', days, today],
    queryFn: async () => {
      const { data } = await api.get<WorshipCorrelation & { ok: boolean }>(
        `/api/insights/worship-correlation?days=${days}&today=${today}&timezoneOffset=${timezoneOffset}`
      );
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}
