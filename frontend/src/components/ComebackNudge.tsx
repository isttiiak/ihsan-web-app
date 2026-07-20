import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuranSummary } from '../hooks/useQuran.js';
import { useAiComeback } from '../hooks/useAi.js';
import { AiPanel, AiBadge, AiDisclaimer } from './ai/AiFlair.js';
import { getTrackingDay } from '../utils/trackingDay.js';

/**
 * The comeback nudge — the highest-leverage moment in a habit app.
 *
 * When someone returns after ≥2 quiet days, meet them with warmth instead of a
 * broken streak. The line is generated ONCE PER DAY and cached in localStorage
 * so a returning user costs a single tiny AI call, never one per page view.
 */

const CACHE_KEY = 'ihsan_comeback_nudge';

function readCache(day: string): string | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as { day?: string; message?: string };
    return raw.day === day && raw.message ? raw.message : null;
  } catch { return null; }
}
function writeCache(day: string, message: string): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ day, message })); } catch { /* full */ }
}

export default function ComebackNudge() {
  const { data: summary } = useQuranSummary();
  const comeback = useAiComeback();
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Count the quiet run ending yesterday (today still in progress doesn't count).
  const last7 = summary?.last7 ?? [];
  let daysAway = 0;
  if (last7.length >= 2 && (last7[last7.length - 1]?.units ?? 0) === 0) {
    for (let i = last7.length - 2; i >= 0; i--) {
      if ((last7[i]?.units ?? 0) > 0) break;
      daysAway++;
    }
  }
  const show = daysAway >= 2 && !dismissed;

  useEffect(() => {
    if (!show) return;
    const day = getTrackingDay();
    const cached = readCache(day);
    if (cached) { setMessage(cached); return; }
    if (comeback.isPending || message) return;
    comeback.mutate(
      { daysAway, bestStreak: summary?.bestStreak ?? 0 },
      { onSuccess: (r) => { setMessage(r.message); writeCache(day, r.message); } }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, daysAway]);

  if (!show || !message) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <AiPanel>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AiBadge label="Welcome back" />
            <button
              className="text-white/35 hover:text-white text-xs"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
            >Dismiss</button>
          </div>
          <p className="text-white/85 text-sm leading-relaxed">{message}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link to="/quran/browse" className="btn btn-xs rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500">
              📖 Read one āyah
            </Link>
            <Link to="/zikr" className="btn btn-xs rounded-xl bg-white/5 border-slate-400/15 text-white/70">
              📿 One dhikr
            </Link>
          </div>
          <AiDisclaimer />
        </div>
      </AiPanel>
    </motion.div>
  );
}
