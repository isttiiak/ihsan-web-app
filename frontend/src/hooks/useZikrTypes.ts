import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import type { ZikrTypeItem } from '../types/api.js';

export function useZikrTypes() {
  const user = useAuthStore((s) => s.user);
  return useQuery<ZikrTypeItem[]>({
    queryKey: ['zikr', 'types'],
    queryFn: async () => {
      const res = await api.get<{ types: ZikrTypeItem[] }>('/api/zikr/types');
      return res.data.types ?? [];
    },
    enabled: !!user,
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

export function useRenameZikrType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { oldName: string; newName: string }) => api.patch('/api/zikr/types/rename', v),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['zikr', 'types'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteZikrType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.delete(`/api/zikr/types/${encodeURIComponent(name)}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['zikr', 'types'] });
    },
  });
}
