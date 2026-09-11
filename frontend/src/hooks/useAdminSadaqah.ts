import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import type { Donation, DonationStatsResponse, DonationStatus } from '../types/api.js';

export function usePendingDonations() {
  return useQuery<Donation[]>({
    queryKey: ['admin', 'sadaqah', 'pending'],
    queryFn: async () => {
      const res = await api.get<{ donations: Donation[] }>('/api/admin/sadaqah/pending');
      return res.data.donations;
    },
    staleTime: 15_000,
  });
}

interface AllDonationsResult {
  donations: Donation[];
  total: number;
  page: number;
  limit: number;
}

export function useAllDonations(status: DonationStatus | undefined, page: number, limit = 20) {
  return useQuery<AllDonationsResult>({
    queryKey: ['admin', 'sadaqah', 'all', status ?? 'any', page, limit],
    queryFn: async () => {
      const res = await api.get<AllDonationsResult>('/api/admin/sadaqah/all', {
        params: { status, page, limit },
      });
      return res.data;
    },
  });
}

export function useVerifyDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/sadaqah/${id}/verify`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sadaqah'] });
      void queryClient.invalidateQueries({ queryKey: ['sadaqah', 'stats'] });
    },
  });
}

export function useRejectDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/api/admin/sadaqah/${id}/reject`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sadaqah'] });
    },
  });
}

interface QuarterlyPatch {
  quarter: string;
  received?: number;
  spent?: number;
  notes?: string;
}

export function useUpsertQuarterly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quarter, ...patch }: QuarterlyPatch) =>
      api.patch<{ stats: DonationStatsResponse }>(`/api/admin/sadaqah/quarterly/${quarter}`, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sadaqah', 'stats'] });
    },
  });
}

export function useDeleteQuarterly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quarter: string) => api.delete(`/api/admin/sadaqah/quarterly/${quarter}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sadaqah', 'stats'] });
    },
  });
}
