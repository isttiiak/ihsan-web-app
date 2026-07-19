import { useMutation } from '@tanstack/react-query';
import api from '../lib/api.js';

/**
 * AI companion hooks — encouragement & personalization only. Every response is
 * labelled in the UI as non-evidential; the backend guardrail refuses any
 * hadith/āyah citation, grade, or ruling.
 */

export interface SuggestResult { suggestions: string[]; motivation: string; ai: boolean; provider?: string }
export interface ReflectResult { reflection: string; ai: boolean; provider?: string }
export interface WeeklyResult { summary: string; encouragement: string; ai: boolean; provider?: string }

export function useAiSuggest() {
  return useMutation({
    mutationFn: async (userSummary: string) => {
      const { data } = await api.post<SuggestResult & { ok: boolean }>('/api/ai/suggest', { userSummary });
      return data;
    },
  });
}

export function useAiReflect() {
  return useMutation({
    mutationFn: async (vars: { surah: number; ayah: number; text: string }) => {
      const { data } = await api.post<ReflectResult & { ok: boolean }>('/api/ai/reflect', vars);
      return data;
    },
  });
}

export function useAiWeekly() {
  return useMutation({
    mutationFn: async (stats: Record<string, unknown>) => {
      const { data } = await api.post<WeeklyResult & { ok: boolean }>('/api/ai/weekly-summary', { stats });
      return data;
    },
  });
}
