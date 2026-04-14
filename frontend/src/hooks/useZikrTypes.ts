import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import type { ZikrTypeItem } from '../types/api.js';

export function useZikrTypes() {
  return useQuery<ZikrTypeItem[]>({
    queryKey: ['zikr', 'types'],
    queryFn: async () => {
      const res = await api.get<{ types: ZikrTypeItem[] }>('/api/zikr/types');
      return res.data.types ?? [];
    },
    staleTime: 60_000,
  });
}

export function useAddZikrType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post('/api/zikr/types', { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['zikr', 'types'] });
    },
  });
}
