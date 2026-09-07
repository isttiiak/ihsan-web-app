import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { getUserTimezoneOffset } from '../utils/timezone.js';
import {
  isPushSupported,
  createPushSubscription,
  removePushSubscription,
  getExistingSubscription,
  toSubscribePayload,
} from '../utils/push.js';

export interface PushCategories {
  streakAtRisk: boolean;
  adhkarWindows: boolean;
  weeklySummary: boolean;
  adhan: boolean;
}

interface PreferencesResponse {
  categories: PushCategories;
  subscribed: boolean;
}

function readSavedLocation(): { lat: number; lng: number } | undefined {
  try {
    const raw = localStorage.getItem('ihsan_location');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { latitude?: number; longitude?: number };
    if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
      return { lat: parsed.latitude, lng: parsed.longitude };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function usePushPreferences() {
  const user = useAuthStore((s) => s.user);
  return useQuery<PreferencesResponse>({
    queryKey: ['push', 'preferences'],
    queryFn: async () => {
      const res = await api.get<{ categories: PushCategories; subscribed: boolean }>(
        '/api/push/preferences'
      );
      return { categories: res.data.categories, subscribed: res.data.subscribed };
    },
    enabled: !!user && isPushSupported(),
    staleTime: 60_000,
  });
}

/** Requests Notification permission + subscribes this browser, then persists
 * it server-side. Call only from a direct user gesture (a button click) —
 * the permission-priming screen in Settings is what asks first. */
export function useSubscribeToPush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categories?: Partial<PushCategories>) => {
      const sub = await createPushSubscription();
      if (!sub) throw new Error('permission-denied');
      await api.post('/api/push/subscribe', {
        ...toSubscribePayload(sub),
        categories,
        timezoneOffset: getUserTimezoneOffset(),
        location: readSavedLocation(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['push'] });
    },
  });
}

export function useUnsubscribeFromPush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const sub = await getExistingSubscription();
      if (!sub) return;
      await api.post('/api/push/unsubscribe', { endpoint: sub.endpoint });
      await removePushSubscription(sub);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['push'] });
    },
  });
}

export function useUpdatePushPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categories: Partial<PushCategories>) =>
      api.patch('/api/push/preferences', { categories }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['push', 'preferences'] });
    },
  });
}
