import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { getUserTimezoneOffset } from '../utils/timezone.js';

export interface FriendStats {
  uid: string;
  displayName: string;
  photoUrl?: string;
  isMe: boolean;
  salatToday: number;
  zikrStreak: number;
  zikrState: 'active' | 'grace' | 'none' | 'paused';
  zikrToday: number;
  zikrGoal: number;
  zikrGoalMet: boolean;
  fastsThisMonth: number;
  fastedToday: boolean;
  quranStreak: number;
  quranPagesToday: number;
  quranGoal: number;
  score: number;
}

export interface SocialSummary {
  inviteCode: string;
  leaderboard: FriendStats[];
}

function localTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useSocialSummary() {
  const user = useAuthStore((s) => s.user);
  const today = localTodayStr();
  return useQuery({
    queryKey: ['social', 'summary', today],
    queryFn: async () => {
      const { data } = await api.get<SocialSummary & { ok: boolean }>(
        `/api/social/summary?today=${today}&timezoneOffset=${getUserTimezoneOffset()}`
      );
      return data;
    },
    enabled: !!user,
    staleTime: 2 * 60_000,
  });
}

export interface NoorResult {
  today: number;
  allTime: number;
}

/** Viewer's Noor for the navbar capsules — light endpoint, cached 5 min */
export function useNoor(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const today = localTodayStr();
  return useQuery({
    queryKey: ['social', 'noor', today],
    queryFn: async () => {
      const { data } = await api.get<NoorResult & { ok: boolean }>(
        `/api/social/noor?today=${today}&timezoneOffset=${getUserTimezoneOffset()}`
      );
      return data;
    },
    enabled: !!user && enabled,
    staleTime: 5 * 60_000,
  });
}

export function useConnectFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<{ ok: boolean; message: string; friendName?: string }>(
        '/api/social/connect',
        { code }
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['social'] });
    },
  });
}

export function useUnfriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendUid: string) => {
      await api.delete(`/api/social/friends/${friendUid}`);
      return friendUid;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['social'] });
    },
    onError: () => toast.error('Could not remove friend — try again.', { id: 'social-unfriend' }),
  });
}
