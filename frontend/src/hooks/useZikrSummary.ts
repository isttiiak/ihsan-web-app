import { useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import type { ZikrSummaryResponse } from '../types/api.js';

export function useZikrSummary() {
  return useQuery<ZikrSummaryResponse>({
    queryKey: ['zikr', 'summary'],
    queryFn: async () => {
      const res = await api.get<ZikrSummaryResponse>('/api/zikr/summary');
      return res.data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}
