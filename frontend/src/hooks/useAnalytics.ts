import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { getUserTimezoneOffset } from '../utils/timezone.js';
import type { AnalyticsResponse, ZikrGoal, ZikrStreak } from '../types/api.js';

export function useAnalytics(days = 7) {
  const timezoneOffset = getUserTimezoneOffset();
  return useQuery<AnalyticsResponse>({
    queryKey: ['analytics', days, timezoneOffset],
    queryFn: async () => {
      const res = await api.get<AnalyticsResponse>('/api/analytics', {
        params: { days, timezoneOffset },
      });
      return res.data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useGoal() {
  return useQuery<ZikrGoal>({
    queryKey: ['analytics', 'goal'],
    queryFn: async () => {
      const res = await api.get<{ goal: ZikrGoal }>('/api/analytics/goal');
      return res.data.goal;
    },
    staleTime: 60_000,
  });
}

export function useStreak() {
  return useQuery<ZikrStreak>({
    queryKey: ['analytics', 'streak'],
    queryFn: async () => {
      const res = await api.get<{ streak: ZikrStreak }>('/api/analytics/streak');
      return res.data.streak;
    },
    staleTime: 30_000,
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dailyTarget: number) =>
      api.post('/api/analytics/goal', { dailyTarget }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function usePauseStreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/analytics/streak/pause'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['analytics', 'streak'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useResumeStreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/analytics/streak/resume'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['analytics', 'streak'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
