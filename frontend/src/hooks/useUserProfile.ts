import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import type { UserProfile } from '../types/api.js';

export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const res = await api.get<{ user: UserProfile }>('/api/user/me');
      return res.data.user;
    },
    staleTime: 60_000,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<UserProfile>) =>
      api.patch('/api/user/me', updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
