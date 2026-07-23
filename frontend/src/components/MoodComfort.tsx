import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAiComfort } from '../hooks/useAi.js';
import { AiBadge } from './ai/AiFlair.js';

/**
 * A gentle line tuned to exactly the feelings she selected today.
 *
 * Cached per (day + mood signature) so changing chips doesn't spam the API —
 * one short call per distinct combination per day.
 */

const CACHE_KEY = 'ihsan_mood_comfort';

function sig(day: string, moods: string[]): string {
  return `${day}|${[...moods].sort().join(',')}`;
}
function readCache(key: string): string | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as { key?: string; message?: string };
    return raw.key === key && raw.message ? raw.message : null;
  } catch { return null; }
}
function writeCache(key: string, message: string): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ key, message })); } catch { /* full */ }
}

export default function MoodComfort({
  day, moods, symptoms,
}: { day: string; moods: string[]; symptoms?: string[] }) {
  const comfort = useAiComfort();
  const [message, setMessage] = useState<string | null>(null);
  const key = sig(day, moods);

  useEffect(() => {
    if (!moods.length) { setMessage(null); return; }
    const cached = readCache(key);
    if (cached) { setMessage(cached); return; }
    setMessage(null);
    comfort.mutate(
      { moods, symptoms },
      { onSuccess: (r) => { setMessage(r.message); writeCache(key, r.message); } }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!moods.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-purple-400/25 bg-purple-500/[0.07] p-3.5"
    >
      <AiBadge label="Naseeh · for you today" />
      {comfort.isPending && !message ? (
        <div className="flex items-center gap-2 mt-2">
          {['#a855f7', '#ec4899', '#06b6d4'].map((c, i) => (
            <motion.span
              key={c} className="w-2 h-2 rounded-full" style={{ background: c }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
          <span className="text-white/40 text-xs">finding the right words…</span>
        </div>
      ) : (
        <p className="text-purple-100/80 text-sm leading-relaxed mt-2">{message}</p>
      )}
      <p className="text-white/30 text-[10px] mt-2">
        ✨ A companion's words — not medical or religious advice.
      </p>
    </motion.div>
  );
}
