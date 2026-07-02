import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import type { ZikrSummaryResponse } from '../types/api.js';

export function useZikrSummary() {
  const user = useAuthStore((s) => s.user);
  return useQuery<ZikrSummaryResponse>({
    queryKey: ['zikr', 'summary'],
    queryFn: async () => {
      const res = await api.get<ZikrSummaryResponse>('/api/zikr/summary');
      return res.data;
    },
    enabled: !!user,
    staleTime: 30_000,
    retry: 1,
  });
}
