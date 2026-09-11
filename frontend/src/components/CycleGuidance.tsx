import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAiCycleGuidance } from '../hooks/useAi.js';
import { AiBadge } from './ai/AiFlair.js';

/**
 * Phase-aware encouragement for Rayhanah — distinct from MoodComfort (which
 * needs her to pick moods first): this shows automatically whenever a cycle
 * is active, tailored to exactly which day of hayd/nifas she's on. The AI
 * only ever supplies the encouragement line — istihada/ghusl fiqh content
 * stays as the app's own static, citation-carrying copy shown elsewhere.
 *
 * Cached per (day + phase + dayCount) so re-renders don't spam the API.
 */

const CACHE_KEY = 'bustandeen_cycle_guidance';

function sig(day: string, phase: string, dayCount: number): string {
  return `${day}|${phase}|${dayCount}`;
}
function readCache(key: string): string | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as {
      key?: string;
      message?: string;
    };
    return raw.key === key && raw.message ? raw.message : null;
  } catch {
    return null;
  }
}
function writeCache(key: string, message: string): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key, message }));
  } catch {
    /* full */
  }
}

export default function CycleGuidance({
  day,
  phase,
  dayCount,
  beyondMax,
}: {
  day: string;
  phase: 'hayd' | 'nifas';
  dayCount: number;
  beyondMax: boolean;
}) {
  const { t } = useTranslation();
  const guidance = useAiCycleGuidance();
  const [message, setMessage] = useState<string | null>(null);
  const key = sig(day, phase, dayCount);

  useEffect(() => {
    const cached = readCache(key);
    if (cached) {
      setMessage(cached);
      return;
    }
    setMessage(null);
    guidance.mutate(
      { phase, dayCount, beyondMax },
      {
        onSuccess: (r) => {
          setMessage(r.message);
          writeCache(key, r.message);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally narrowed; the omitted values are stable or would retrigger this effect unnecessarily
  }, [key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-pink/25 bg-brand-pink/[0.07] p-3.5"
    >
      <AiBadge label={t('naseeh.forYouToday', 'Naseeh · for you today')} />
      {guidance.isPending && !message ? (
        <div className="flex items-center gap-2 mt-2">
          {['#c4825a', '#c4825a', '#5a9e8e'].map((c, i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: c }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
          <span className="text-white/40 text-xs">{t('naseeh.findingWords')}</span>
        </div>
      ) : (
        <p className="text-brand-pink/80 text-sm leading-relaxed mt-2">{message}</p>
      )}
      <p className="text-white/30 text-[10px] mt-2">
        {t('naseeh.disclaimer', "✨ A companion's words — not medical or religious advice.")}
      </p>
    </motion.div>
  );
}
