import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import type {
  DonationStatsResponse,
  SadaqahConfigResponse,
  SubmitDonationRequest,
} from '../types/api.js';

export function useSadaqahStats() {
  return useQuery<DonationStatsResponse>({
    queryKey: ['sadaqah', 'stats'],
    queryFn: async () => {
      const res = await api.get<DonationStatsResponse>('/api/sadaqah/stats');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useSadaqahConfig() {
  return useQuery<SadaqahConfigResponse>({
    queryKey: ['sadaqah', 'config'],
    queryFn: async () => {
      const res = await api.get<SadaqahConfigResponse>('/api/sadaqah/config');
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useSubmitDonation() {
  return useMutation({
    mutationFn: (payload: SubmitDonationRequest) =>
      api.post<{ ok: boolean; id: string; status: string }>('/api/sadaqah/submit', payload),
  });
}
