import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../../hooks/useAnalytics.js';
import { useQuranSummary } from '../../hooks/useQuran.js';
import { useSalatAnalytics } from '../../hooks/useSalatLog.js';
import { useFastingSummary } from '../../hooks/useFasting.js';
import { useAiWeekly, useAiActivityInsight } from '../../hooks/useAi.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { AiPanel, AiBadge, AiDisclaimer, AiThinking } from './AiFlair.js';
import { getTrackingDay } from '../../utils/trackingDay.js';

const WEEKLY_KEY = 'ihsan_naseeh_weekly';
const INSIGHT_KEY = 'ihsan_naseeh_insight';

function weekId(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86_400_000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function monthId(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface CachedWeekly {
  weekId: string;
  summary: string;
  encouragement: string;
}
interface CachedInsight {
  monthId: string;
  headline: string;
  insights: string[];
}

function readCache<T>(key: string, id: string, field: string): T | null {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
    return raw[field] === id ? (raw as unknown as T) : null;
  } catch {
    return null;
  }
}
function writeCache(key: string, data: object): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* full */
  }
}

export default function NaseehInsights() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const aiEnabled = useAuthStore((s) => s.aiEnabled);
  const { data: zikrData } = useAnalytics(7);
  const { data: quranSummary } = useQuranSummary();
  const { data: salatAnalytics } = useSalatAnalytics(30);
  const { data: fastingSummary } = useFastingSummary();
  const weeklyMut = useAiWeekly();
  const insightMut = useAiActivityInsight();

  const [weekly, setWeekly] = useState<CachedWeekly | null>(null);
  const [insight, setInsight] = useState<CachedInsight | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const wk = weekId();
  const mo = monthId();

  const weeklyStats = useMemo(() => {
    if (!zikrData && !quranSummary && !salatAnalytics && !fastingSummary) return null;
    return {
      zikrTotal7d:
        zikrData?.chartData?.reduce((a: number, d: { total?: number }) => a + (d.total ?? 0), 0) ??
        0,
      zikrStreak: zikrData?.streak?.currentStreak ?? 0,
      salatStreak: salatAnalytics?.currentStreak ?? 0,
      salatPct30d: salatAnalytics?.completionRate ?? 0,
      quranStreak: quranSummary?.streak ?? 0,
      quranAyatToday: quranSummary?.todayAyat ?? 0,
      fastingThisMonth: fastingSummary?.stats?.thisMonth ?? 0,
    };
  }, [zikrData, quranSummary, salatAnalytics, fastingSummary]);

  useEffect(() => {
    if (!user || !aiEnabled) return;
    const cached = readCache<CachedWeekly>(WEEKLY_KEY, wk, 'weekId');
    if (cached) {
      setWeekly(cached);
      return;
    }
    if (!weeklyStats || weeklyMut.isPending) return;
    weeklyMut.mutate(weeklyStats, {
      onSuccess: (r) => {
        const entry: CachedWeekly = {
          weekId: wk,
          summary: r.summary,
          encouragement: r.encouragement,
        };
        setWeekly(entry);
        writeCache(WEEKLY_KEY, entry);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally narrowed; the omitted values are stable or would retrigger this effect unnecessarily
  }, [user, aiEnabled, wk, !!weeklyStats]);

  useEffect(() => {
    if (!user || !aiEnabled) return;
    const cached = readCache<CachedInsight>(INSIGHT_KEY, mo, 'monthId');
    if (cached) {
      setInsight(cached);
      return;
    }
    if (!weeklyStats || insightMut.isPending) return;
    const insightStats = {
      ...weeklyStats,
      month: mo,
      trackingDay: getTrackingDay(),
    };
    insightMut.mutate(insightStats, {
      onSuccess: (r) => {
        const entry: CachedInsight = { monthId: mo, headline: r.headline, insights: r.insights };
        setInsight(entry);
        writeCache(INSIGHT_KEY, entry);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally narrowed; the omitted values are stable or would retrigger this effect unnecessarily
  }, [user, aiEnabled, mo, !!weeklyStats]);

  if (!user || !aiEnabled || dismissed) return null;
  const loading = weeklyMut.isPending || insightMut.isPending;
  if (!weekly && !insight && !loading) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <AiPanel>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AiBadge label={t('naseehInsights.badgeLabel', 'Naseeh · your week')} />
            <button
              className="text-white/30 hover:text-white text-xs"
              onClick={() => setDismissed(true)}
              aria-label={t('naseehInsights.dismiss', 'Dismiss')}
            >
              {t('naseehInsights.dismiss', 'Dismiss')}
            </button>
          </div>

          {loading && !weekly && !insight && (
            <AiThinking label={t('naseehInsights.thinkingLabel', 'Naseeh is reading your week…')} />
          )}

          {weekly && (
            <div className="space-y-1.5">
              <p className="text-white/80 text-sm leading-relaxed">{weekly.summary}</p>
              <p className="text-brand-info/80 text-sm italic">{weekly.encouragement}</p>
            </div>
          )}

          {insight && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
              <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">
                {t('naseehInsights.monthlyPatterns', 'Monthly patterns')}
              </p>
              <p className="text-white/70 text-sm font-semibold">{insight.headline}</p>
              {insight.insights.map((ins, i) => (
                <p
                  key={i}
                  className="text-white/50 text-xs leading-relaxed pl-3 border-l-2 border-brand-emerald/20"
                >
                  {ins}
                </p>
              ))}
            </div>
          )}

          <AiDisclaimer />
        </div>
      </AiPanel>
    </motion.div>
  );
}
