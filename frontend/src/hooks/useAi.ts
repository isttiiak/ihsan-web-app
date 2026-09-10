import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

/**
 * AI companion hooks — encouragement & personalization only. Every response is
 * labelled in the UI as non-evidential; the backend guardrail refuses any
 * hadith/āyah citation, grade, or ruling.
 */

export interface SuggestResult {
  suggestions: string[];
  motivation: string;
  ai: boolean;
  provider?: string;
}
export interface WeeklyResult {
  summary: string;
  encouragement: string;
  ai: boolean;
  provider?: string;
}
export interface NudgeResult {
  message: string;
  ai: boolean;
  provider?: string;
  /** Set by /comfort when a named mood (low/anxious) warrants pointing to real support. */
  resourceNote?: boolean;
}
export interface CoachResult {
  message: string;
  tip: string;
  ai: boolean;
  provider?: string;
}
export interface FastingCompanionResult {
  message: string;
  ai: boolean;
  provider?: string;
}
export interface InsightResult {
  insights: string[];
  headline: string;
  ai: boolean;
  provider?: string;
}

export function useAiSuggest() {
  return useMutation({
    mutationFn: async (userSummary: string) => {
      const { data } = await api.post<SuggestResult & { ok: boolean }>('/api/ai/suggest', {
        userSummary,
      });
      return data;
    },
  });
}

export function useAiWeekly() {
  return useMutation({
    mutationFn: async (stats: Record<string, unknown>) => {
      const { data } = await api.post<WeeklyResult & { ok: boolean }>('/api/ai/weekly-summary', {
        stats,
      });
      return data;
    },
  });
}

export function useAiComeback() {
  return useMutation({
    mutationFn: async (vars: { daysAway: number; bestStreak?: number }) => {
      const { data } = await api.post<NudgeResult & { ok: boolean }>('/api/ai/comeback', vars);
      return data;
    },
  });
}

export function useAiComfort() {
  return useMutation({
    mutationFn: async (vars: { moods: string[]; symptoms?: string[] }) => {
      const { data } = await api.post<NudgeResult & { ok: boolean }>('/api/ai/comfort', vars);
      return data;
    },
  });
}

export function useAiCycleGuidance() {
  return useMutation({
    mutationFn: async (vars: { phase: 'hayd' | 'nifas'; dayCount: number; beyondMax: boolean }) => {
      const { data } = await api.post<NudgeResult & { ok: boolean }>(
        '/api/ai/cycle-guidance',
        vars
      );
      return data;
    },
  });
}

export function useAiStreakCoach() {
  return useMutation({
    mutationFn: async (vars: {
      event: 'milestone' | 'break';
      streakDays?: number;
      feature: string;
      bestStreak?: number;
    }) => {
      const { data } = await api.post<CoachResult & { ok: boolean }>(
        '/api/ai/streak-coaching',
        vars
      );
      return data;
    },
  });
}

export function useAiFastingCompanion() {
  return useMutation({
    mutationFn: async (vars: {
      period: 'morning' | 'evening';
      fastType: string;
      dayNumber?: number;
    }) => {
      const { data } = await api.post<FastingCompanionResult & { ok: boolean }>(
        '/api/ai/fasting-companion',
        vars
      );
      return data;
    },
  });
}

export function useAiActivityInsight() {
  return useMutation({
    mutationFn: async (stats: Record<string, unknown>) => {
      const { data } = await api.post<InsightResult & { ok: boolean }>('/api/ai/activity-insight', {
        stats,
      });
      return data;
    },
  });
}

// ── Bring-your-own Groq key (Settings > AI) ──────────────────────────────────
// Write-only by design: the key is never echoed back once saved, so the UI
// only ever knows whether one is set, not its value.
const GROQ_KEY_QUERY_KEY = ['ai', 'groq-key-status'] as const;

export interface GroqKeyStatus {
  hasOwnKey: boolean;
  /** ISO date string the current key was saved, or null if none/cleared. */
  setAt: string | null;
}

export function useGroqKeyStatus() {
  return useQuery({
    queryKey: GROQ_KEY_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ ok: boolean } & GroqKeyStatus>('/api/ai/groq-key');
      return { hasOwnKey: data.hasOwnKey, setAt: data.setAt };
    },
  });
}

export function useSetGroqKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (apiKey: string) => {
      const { data } = await api.put<{ ok: boolean } & GroqKeyStatus>('/api/ai/groq-key', {
        apiKey,
      });
      return data;
    },
    onSuccess: (data) => queryClient.setQueryData(GROQ_KEY_QUERY_KEY, data),
  });
}

export function useClearGroqKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ ok: boolean } & GroqKeyStatus>('/api/ai/groq-key');
      return data;
    },
    onSuccess: (data) => queryClient.setQueryData(GROQ_KEY_QUERY_KEY, data),
  });
}
