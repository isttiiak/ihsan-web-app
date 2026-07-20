import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  useCycleSummary, useStartCycle, useEndCycle, useSetMadhab, useDeleteCycleLog, useIsFemale,
  useUpsertCycleDay, type CycleFlow, type CycleMood,
} from '../hooks/useCycle.js';
import CycleCalendar from '../components/CycleCalendar.js';
import ConfirmDialog from '../components/ConfirmDialog.js';
import TabNav from '../components/TabNav.js';
import { useFastingSummary, useUpdateFastingProfile } from '../hooks/useFasting.js';
import { getTrackingDay } from '../utils/trackingDay.js';
import { getHijriDate } from '../utils/islamicCalendar.js';
import { celebrateSmall } from '../utils/celebrate.js';

// ─── Sweet, powerful phrases for excused days (Istiak's spec) ─────────────────
const PHRASES = [
  '🌸 Your rest is written by the Most Merciful — and your reward never pauses.',
  '🌷 Allah lifted the prayer from you these days; He never lifted His love.',
  '🌺 A heart that remembers Allah blooms in every season.',
  '🌹 These days are not a gap in your worship — they are a different garden of it.',
  '🌼 Dhikr, duʿā, gratitude — your garden is still growing.',
  "💮 What is with Allah is never lost — He sees every gentle 'SubhanAllah'.",
  '🌸 Ease is also from Him. Rest, remember, and let your heart do the worshipping.',
  '🌻 The Beloved ﷺ said the deeds most loved by Allah are the constant ones — your dhikr counts.',
];

function phraseOfDay(offset = 0): string {
  const day = Math.floor(new Date(getTrackingDay() + 'T12:00:00').getTime() / 86_400_000);
  return PHRASES[(day + offset) % PHRASES.length]!;
}

// ─── Garden of Light — daily checklist (device-local, never sent anywhere) ────
interface GardenItem { id: string; icon: string; label: string; link?: string }
const GARDEN_ITEMS: GardenItem[] = [
  { id: 'adhkar', icon: '🌅', label: 'Morning & evening adhkār' },
  { id: 'dhikr', icon: '📿', label: 'A dhikr session (any amount counts)', link: '/zikr' },
  { id: 'salawat', icon: '💚', label: 'Ṣalawāt upon the Prophet ﷺ', link: '/zikr' },
  { id: 'istighfar', icon: '🌧️', label: 'Istighfār — seek forgiveness', link: '/zikr' },
  { id: 'listen', icon: '🎧', label: 'Listen to Quran (log it as pages)', link: '/quran' },
  { id: 'learn', icon: '📚', label: 'Learn one thing (tafsīr, a lecture, a hadith)' },
  { id: 'kindness', icon: '🎁', label: 'One act of kindness or charity' },
];

function gardenKey(): string {
  return `ihsan_rayhanah_garden_${getTrackingDay()}`;
}
function loadGarden(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(gardenKey()) ?? '{}') as Record<string, boolean>; }
  catch { return {}; }
}

// ─── Ghusl steps (Bukhari 248 — Maimunah's description) ───────────────────────
const GHUSL_STEPS = [
  'Make the intention (niyyah) in your heart to purify yourself',
  'Wash both hands, then wash away any traces of blood',
  'Perform a complete wuḍū as for prayer',
  'Pour water over your head three times, massaging it to the roots of the hair',
  'Pour water over your whole body — right side first, then left',
];

// ─── "How are you today?" chips ───────────────────────────────────────────────
const FLOW_OPTIONS: Array<{ id: CycleFlow; label: string }> = [
  { id: 'light', label: '💧 Light' },
  { id: 'medium', label: '💧💧 Medium' },
  { id: 'heavy', label: '💧💧💧 Heavy' },
];
const SYMPTOM_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'cramps', label: '🌀 Cramps' },
  { id: 'headache', label: '🤕 Headache' },
  { id: 'fatigue', label: '🪫 Fatigue' },
  { id: 'nausea', label: '🌊 Nausea' },
  { id: 'backache', label: '🦴 Backache' },
  { id: 'bloating', label: '🎈 Bloating' },
  { id: 'tenderness', label: '🌡️ Tenderness' },
  { id: 'insomnia', label: '🌙 Insomnia' },
];
const MOOD_OPTIONS: Array<{ id: CycleMood; label: string }> = [
  { id: 'calm', label: '🕊️ Calm' },
  { id: 'happy', label: '🌈 Happy' },
  { id: 'low', label: '🌧️ Low' },
  { id: 'irritable', label: '🌪️ Irritable' },
  { id: 'anxious', label: '〰️ Anxious' },
  { id: 'tired', label: '🛌 Tired' },
];

function formatDay(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Count days in [start..end] that fall in (adjusted) Ramadan — for auto-qada */
function ramadanDaysIn(start: string, end: string): number {
  let n = 0;
  const d = new Date(start + 'T12:00:00');
  const stop = new Date(end + 'T12:00:00');
  let guard = 0;
  while (d <= stop && guard < 90) {
    if (getHijriDate(d)?.month === 9) n++;
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return n;
}

export default function RayhanahCycle() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isFemale = useIsFemale();
  const today = getTrackingDay();

  const { data: summary, isLoading, isError, refetch } = useCycleSummary();
  const { data: fastingSummary } = useFastingSummary();
  const startCycle = useStartCycle();
  const endCycle = useEndCycle();
  const setMadhab = useSetMadhab();
  const deleteLog = useDeleteCycleLog();
  const updateFastingProfile = useUpdateFastingProfile();
  const upsertDay = useUpsertCycleDay();

  const [startOpen, setStartOpen] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [startType, setStartType] = useState<'hayd' | 'nifas'>('hayd');
  const [ghuslOpen, setGhuslOpen] = useState(false);
  const [ghuslChecked, setGhuslChecked] = useState<boolean[]>(GHUSL_STEPS.map(() => false));
  const [qadaPrompt, setQadaPrompt] = useState<{ days: number } | null>(null);
  const [garden, setGarden] = useState<Record<string, boolean>>(loadGarden);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { setGarden(loadGarden()); }, [today]);

  const toggleGarden = (id: string) => {
    const next = { ...garden, [id]: !garden[id] };
    setGarden(next);
    localStorage.setItem(gardenKey(), JSON.stringify(next));
    if (!garden[id]) celebrateSmall();
  };
  const gardenDone = GARDEN_ITEMS.filter((g) => garden[g.id]).length;

  const active = summary?.active ?? null;
  const todayNote = summary?.days?.find((d) => d.date === today) ?? null;

  const setFlow = (flow: CycleFlow) =>
    upsertDay.mutate({ date: today, flow: todayNote?.flow === flow ? null : flow });
  const toggleSymptom = (id: string) => {
    const cur = todayNote?.symptoms ?? [];
    upsertDay.mutate({ date: today, symptoms: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };
  // Moods are multi-select — a day can hold several feelings (Istiak).
  const toggleMood = (mood: CycleMood) => {
    const cur = todayNote?.moods ?? [];
    upsertDay.mutate({ date: today, moods: cur.includes(mood) ? cur.filter((m) => m !== mood) : [...cur, mood] });
  };

  const handleEndConfirmed = () => {
    const startedOn = active?.startDate;
    endCycle.mutate({ date: today }, {
      onSuccess: () => {
        setGhuslOpen(true);
        setGhuslChecked(GHUSL_STEPS.map(() => false));
        if (startedOn) {
          const n = ramadanDaysIn(startedOn, today);
          if (n > 0) setQadaPrompt({ days: n });
        }
      },
    });
  };

  const addQada = () => {
    if (!qadaPrompt) return;
    const current = fastingSummary?.profile?.qadaOwed ?? 0;
    updateFastingProfile.mutate({ qadaOwed: current + qadaPrompt.days }, {
      onSuccess: () => {
        toast.success(`${qadaPrompt.days} qaḍā day${qadaPrompt.days > 1 ? 's' : ''} added — the tracker will guide you 🌸`);
        setQadaPrompt(null);
      },
    });
  };

  const nextStartLabel = useMemo(() => {
    const ns = summary?.prediction?.nextStart;
    return ns ? formatDay(ns) : null;
  }, [summary]);

  if (!user) return null;
  if (!isFemale) {
    // Gentle gate — the page is reachable only from the female-only menu entry
    return (
      <div className="min-h-[60vh] grid place-items-center px-4 text-center">
        <div>
          <div className="text-5xl mb-4">🌸</div>
          <p className="text-white/60 text-sm max-w-sm">
            Rayhanah Cycle is a private space for our sisters. Set your gender to
            female in <button className="text-brand-emerald underline" onClick={() => navigate('/profile')}>your profile</button> to open it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Rayhanah Cycle</h1>
      <div className="px-4 pt-3">
        <div className="max-w-2xl mx-auto">
          <TabNav
            items={[
              { label: '🌸 Cycle', to: '/cycle', active: true },
              { label: '📊 Analytics', to: '/cycle/analytics' },
            ]}
          />
        </div>
      </div>
      <div className="relative max-w-2xl mx-auto px-4 pt-4 pb-16 space-y-5">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-10 grid place-items-center">
            <span className="loading loading-spinner loading-lg text-pink-300" />
          </div>
        ) : isError ? (
          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-8 text-center space-y-3">
            <p className="text-white/60 text-sm">Couldn't load your cycle data.</p>
            <button className="btn btn-sm bg-pink-500/20 border-pink-400/30 text-pink-200" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : active ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 sm:p-8 border border-pink-400/25 bg-gradient-to-br from-pink-500/15 via-rose-500/10 to-purple-500/10 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-pink-500/15 blur-2xl animate-pulse" />
            <div className="relative">
              <div className="flex items-center gap-2 text-pink-200/90 text-xs font-bold uppercase tracking-widest">
                {active.type === 'nifas' ? '🤱 Nifās — post-natal rest' : '🌸 Rayhanah days'}
              </div>
              <h1 className="text-3xl font-black text-white mt-2">
                Day {active.dayCount}
                <span className="text-white/40 text-lg font-semibold"> · since {formatDay(active.startDate)}</span>
              </h1>
              <p className="text-pink-100/80 text-sm mt-3 leading-relaxed">{phraseOfDay()}</p>

              {active.beyondMax && (
                <div className="mt-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 p-4 text-amber-100/90 text-xs leading-relaxed">
                  <span className="font-bold">Day {active.dayCount} has passed the {active.maxDays}-day maximum
                  ({summary?.madhab === 'hanafi' ? 'Ḥanafī' : 'majority'} view{active.type === 'nifas' ? ', nifās' : ''}).</span>{' '}
                  Bleeding beyond the maximum is usually <span className="font-bold">istiḥāḍa</span> — prayer resumes
                  with fresh wuḍū for each prayer (
                  <a className="underline" href="https://sunnah.com/bukhari:306" target="_blank" rel="noreferrer">Bukhārī 306</a>
                  ). Please confirm with a scholar you trust.
                </div>
              )}

              <button
                className="mt-5 w-full btn h-14 rounded-2xl border-0 text-white text-base font-black bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 shadow-lg shadow-pink-900/40"
                onClick={handleEndConfirmed}
                disabled={endCycle.isPending}
              >
                {endCycle.isPending ? <span className="loading loading-spinner" /> : '🕊️ My period has ended'}
              </button>
              <p className="text-white/30 text-[11px] text-center mt-2">
                Tap when the bleeding has fully stopped — the ghusl guide opens next.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 sm:p-8 border border-brand-border bg-brand-deep/80 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 text-emerald-300/80 text-xs font-bold uppercase tracking-widest">
              ✨ Days of purity
            </div>
            <h1 className="text-2xl font-black text-white mt-2">Assalamu alaikum, {user.displayName?.split(' ')[0] ?? 'sister'} 🌷</h1>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">
              {nextStartLabel
                ? <>Based on your history, your next period is expected around <span className="text-pink-200 font-semibold">{nextStartLabel}</span> (avg cycle {summary?.prediction.avgCycleDays} days).</>
                : 'Log your first cycle and Rayhanah will learn your rhythm to predict the next one.'}
            </p>
            <button
              className="mt-5 w-full btn h-14 rounded-2xl border border-pink-400/30 bg-pink-500/15 hover:bg-pink-500/25 text-pink-100 text-base font-black"
              onClick={() => { setStartDate(today); setStartType('hayd'); setStartOpen(true); }}
            >
              🌸 My period started
            </button>
          </motion.div>
        )}

        {/* ── Garden of Light (only during excused days) ────────────────────── */}
        {active && (
          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black">🪻 Garden of Light</h2>
              <span className="text-xs font-bold text-pink-200/80">{gardenDone}/{GARDEN_ITEMS.length} today</span>
            </div>
            <p className="text-white/40 text-xs mt-1">
              Everything here remains fully open to you — the Prophet ﷺ remembered Allah in all states
              (<a className="underline" href="https://sunnah.com/muslim:373" target="_blank" rel="noreferrer">Muslim 373</a>).
            </p>
            <div className="mt-3 space-y-1.5">
              {GARDEN_ITEMS.map((g) => (
                <div key={g.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/3 hover:bg-white/6 transition-colors">
                  <button
                    aria-label={`Mark ${g.label}`}
                    onClick={() => toggleGarden(g.id)}
                    className={`w-6 h-6 rounded-full grid place-items-center border transition-all flex-shrink-0 ${garden[g.id] ? 'bg-pink-500 border-pink-400 text-white' : 'border-slate-400/20 text-transparent hover:border-pink-300/60'}`}
                  >
                    ✓
                  </button>
                  <span className={`text-sm flex-1 ${garden[g.id] ? 'text-white/40 line-through' : 'text-white/80'}`}>
                    {g.icon} {g.label}
                  </span>
                  {g.link && (
                    <button className="text-xs text-pink-300/80 hover:text-pink-200" onClick={() => navigate(g.link!)}>
                      Open →
                    </button>
                  )}
                </div>
              ))}
            </div>
            {gardenDone === GARDEN_ITEMS.length && (
              <p className="text-center text-pink-200/90 text-sm font-semibold mt-3">🌺 Mā shāʾ Allāh — a full garden today!</p>
            )}
          </div>
        )}

        {/* ── How are you today? (private wellness note) ────────────────────── */}
        {active && (
          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black">🌷 How are you today?</h2>
              <span className="text-[10px] text-white/25">private — only you can see this</span>
            </div>
            <div>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-wide mb-1.5">Flow</p>
              <div className="flex flex-wrap gap-1.5">
                {FLOW_OPTIONS.map((f) => (
                  <button key={f.id}
                    className={`btn btn-xs rounded-full border ${todayNote?.flow === f.id ? 'bg-pink-500/30 border-pink-400/50 text-pink-100' : 'bg-white/5 border-slate-400/10 text-white/50 hover:text-white'}`}
                    onClick={() => setFlow(f.id)}
                  >{f.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-wide mb-1.5">Body</p>
              <div className="flex flex-wrap gap-1.5">
                {SYMPTOM_OPTIONS.map((sy) => (
                  <button key={sy.id}
                    className={`btn btn-xs rounded-full border ${todayNote?.symptoms?.includes(sy.id) ? 'bg-rose-500/25 border-rose-400/40 text-rose-100' : 'bg-white/5 border-slate-400/10 text-white/50 hover:text-white'}`}
                    onClick={() => toggleSymptom(sy.id)}
                  >{sy.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-wide mb-1.5">Heart <span className="normal-case font-normal text-white/25">· pick any that fit</span></p>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map((mo) => (
                  <button key={mo.id}
                    className={`btn btn-xs rounded-full border ${todayNote?.moods?.includes(mo.id) ? 'bg-purple-500/25 border-purple-400/40 text-purple-100' : 'bg-white/5 border-slate-400/10 text-white/50 hover:text-white'}`}
                    onClick={() => toggleMood(mo.id)}
                  >{mo.label}</button>
                ))}
              </div>
            </div>
            {(todayNote?.symptoms?.length ?? 0) > 0 && (
              <p className="text-pink-200/70 text-xs leading-relaxed border-t border-slate-400/5 pt-2.5">
                May Allah give you ease — no fatigue or pain touches a Muslim except that Allah wipes away
                sins with it (<a className="underline" href="https://sunnah.com/bukhari:5641" target="_blank" rel="noreferrer">Bukhārī 5641</a>). 🌸
              </p>
            )}
          </div>
        )}

        {/* ── Cycle calendar + stats ────────────────────────────────────────── */}
        {summary && <CycleCalendar summary={summary} today={today} />}
        {summary && summary.prediction.basedOnCycles > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
              <p className="text-2xl font-black text-pink-200">{summary.prediction.avgCycleDays}</p>
              <p className="text-white/35 text-[10px] font-bold uppercase tracking-wide mt-1">avg cycle days</p>
            </div>
            <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
              <p className="text-2xl font-black text-pink-200">{summary.prediction.avgPeriodDays}</p>
              <p className="text-white/35 text-[10px] font-bold uppercase tracking-wide mt-1">avg period days</p>
            </div>
            <div className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 text-center">
              <p className="text-2xl font-black text-pink-200">{summary.prediction.basedOnCycles + 1}</p>
              <p className="text-white/35 text-[10px] font-bold uppercase tracking-wide mt-1">cycles learned</p>
            </div>
          </div>
        )}

        {/* ── What changes / what stays (education) ─────────────────────────── */}
        <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5 space-y-4">
          <h2 className="text-white font-black">📖 Your fiqh companion</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs leading-relaxed">
            <div className="rounded-2xl bg-rose-500/10 border border-rose-400/20 p-4">
              <p className="font-bold text-rose-200 mb-1.5">Paused for now 🌙</p>
              <ul className="space-y-1 text-white/60">
                <li>• Ṣalāt — fully excused, <span className="font-semibold text-rose-200/90">never made up</span> (<a className="underline" href="https://sunnah.com/muslim:335" target="_blank" rel="noreferrer">Muslim 335</a>)</li>
                <li>• Fasting — excused now, made up later (<a className="underline" href="https://sunnah.com/muslim:335" target="_blank" rel="noreferrer">Muslim 335</a>)</li>
                <li>• Ṭawāf around the Kaʿbah (<a className="underline" href="https://sunnah.com/bukhari:305" target="_blank" rel="noreferrer">Bukhārī 305</a>)</li>
                <li>• Intimacy during menses (<a className="underline" href="https://quran.com/2/222" target="_blank" rel="noreferrer">Quran 2:222</a>)</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4">
              <p className="font-bold text-emerald-200 mb-1.5">Fully open to you 🌸</p>
              <ul className="space-y-1 text-white/60">
                <li>• All dhikr, duʿā & ṣalawāt (<a className="underline" href="https://sunnah.com/muslim:373" target="_blank" rel="noreferrer">Muslim 373</a>)</li>
                <li>• Listening to the Quran, tafsīr & knowledge</li>
                <li>• Attending gatherings of good & duʿā (<a className="underline" href="https://sunnah.com/bukhari:971" target="_blank" rel="noreferrer">Bukhārī 971</a>)</li>
                <li>• Charity, kindness, and serving others</li>
              </ul>
            </div>
          </div>
          <p className="text-white/35 text-[11px] leading-relaxed">
            The Prophet ﷺ told ʿĀʾishah (may Allah be pleased with her) during Hajj:
            do everything the pilgrim does, except ṭawāf —{' '}
            <a className="underline" href="https://sunnah.com/bukhari:305" target="_blank" rel="noreferrer">Ṣaḥīḥ al-Bukhārī 305</a>.
            Reciting Quran from memory is a matter of scholarly difference; listening is agreed upon. Ask a scholar you trust.
          </p>
        </div>

        {/* ── Settings + history ─────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Hayd maximum (madhab)</p>
              <p className="text-white/35 text-xs">Ḥanafī: 10 days · Majority (Shāfiʿī/Ḥanbalī/Mālikī): 15 days</p>
            </div>
            <div className="join">
              {(['hanafi', 'majority'] as const).map((m) => (
                <button
                  key={m}
                  className={`join-item btn btn-xs ${summary?.madhab === m ? 'bg-pink-500/30 border-pink-400/40 text-pink-100' : 'bg-white/5 border-slate-400/10 text-white/50'}`}
                  onClick={() => setMadhab.mutate(m)}
                >
                  {m === 'hanafi' ? 'Ḥanafī' : 'Majority'}
                </button>
              ))}
            </div>
          </div>

          <button
            className="w-full text-left text-sm text-white/60 hover:text-white flex items-center justify-between"
            onClick={() => setHistoryOpen((v) => !v)}
          >
            <span>🗓️ Cycle history ({summary?.logs.length ?? 0})</span>
            <span className="text-white/30">{historyOpen ? '▴' : '▾'}</span>
          </button>
          <AnimatePresence>
            {historyOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                {(summary?.logs ?? []).length === 0 ? (
                  <p className="text-white/30 text-xs py-2">No cycles logged yet.</p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {(summary?.logs ?? []).map((l) => (
                      <div key={l._id} className="flex items-center gap-3 rounded-xl bg-white/3 px-3 py-2 text-xs">
                        <span>{l.type === 'nifas' ? '🤱' : '🌸'}</span>
                        <span className="text-white/70 flex-1">
                          {formatDay(l.startDate)} — {l.endDate ? formatDay(l.endDate) : 'ongoing'}
                        </span>
                        <button aria-label="Delete entry" className="text-white/25 hover:text-red-300" onClick={() => setConfirmDelete(l._id)}>🗑</button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-white/25 text-[10px] leading-relaxed border-t border-slate-400/5 pt-3">
            🔒 Your cycle data is visible only to you. It is never shown to friends — on the leaderboard your
            Noor simply flows from the dhikr, Quran and ṣalawāt you do, exactly like any other day.
          </p>
        </div>
      </div>

      {/* ── Start modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {startOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setStartOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-3xl bg-brand-deep border border-pink-400/25 p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-black text-lg">🌸 Log the start</h3>
              <div>
                <label className="text-white/50 text-xs font-bold" htmlFor="cycle-start-date">Start date</label>
                <input
                  id="cycle-start-date" type="date" value={startDate} max={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input input-bordered w-full mt-1 bg-white/5 border-slate-400/10 text-white"
                />
              </div>
              <div className="flex gap-2">
                {(['hayd', 'nifas'] as const).map((t) => (
                  <button key={t}
                    className={`flex-1 btn btn-sm rounded-xl ${startType === t ? 'bg-pink-500/30 border-pink-400/40 text-pink-100' : 'bg-white/5 border-slate-400/10 text-white/50'}`}
                    onClick={() => setStartType(t)}
                  >
                    {t === 'hayd' ? '🌸 Period (hayd)' : '🤱 Post-natal (nifās)'}
                  </button>
                ))}
              </div>
              <button
                className="w-full btn rounded-2xl border-0 text-white font-black bg-gradient-to-r from-pink-500 to-rose-500"
                disabled={startCycle.isPending}
                onClick={() => startCycle.mutate({ date: startDate, type: startType }, { onSuccess: () => setStartOpen(false) })}
              >
                {startCycle.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Begin Rayhanah days'}
              </button>
              <p className="text-white/30 text-[11px] text-center leading-relaxed">
                Salat & fasting pause automatically — your Noor continues from dhikr, Quran & ṣalawāt. 🌷
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ghusl modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {ghuslOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-3xl bg-brand-deep border border-emerald-400/25 p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <h3 className="text-white font-black text-lg">🕊️ Welcome back to salat</h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Perform ghusl the way the Prophet ﷺ did (
                <a className="underline" href="https://sunnah.com/bukhari:248" target="_blank" rel="noreferrer">Bukhārī 248</a>):
              </p>
              <div className="space-y-1.5">
                {GHUSL_STEPS.map((step, i) => (
                  <button key={step} className="w-full flex items-start gap-3 rounded-xl px-3 py-2.5 bg-white/3 hover:bg-white/6 text-left"
                    onClick={() => setGhuslChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                  >
                    <span className={`w-5 h-5 rounded-full grid place-items-center border text-[10px] flex-shrink-0 mt-0.5 ${ghuslChecked[i] ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-400/20 text-white/30'}`}>
                      {ghuslChecked[i] ? '✓' : i + 1}
                    </span>
                    <span className={`text-xs leading-relaxed ${ghuslChecked[i] ? 'text-white/40 line-through' : 'text-white/75'}`}>{step}</span>
                  </button>
                ))}
              </div>
              <p className="text-emerald-200/80 text-xs leading-relaxed">
                Then pray the ṣalāt of the time you're now in — no past prayers to make up
                (<a className="underline" href="https://sunnah.com/muslim:335" target="_blank" rel="noreferrer">Muslim 335</a>). Welcome back 🌸
              </p>
              <button
                className="w-full btn rounded-2xl border-0 text-white font-black bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={() => { setGhuslOpen(false); celebrateSmall(); }}
              >
                Alhamdulillah 🤲
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Second confirmation for deletes (app-wide rule) */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove this cycle?"
        message="This entry will be removed from your history and predictions."
        onConfirm={() => { if (confirmDelete) deleteLog.mutate(confirmDelete); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* ── Ramadan qada prompt ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {qadaPrompt && !ghuslOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-brand-deep border border-amber-400/25 p-6 space-y-4"
            >
              <h3 className="text-white font-black text-lg">🌙 Ramadan days to make up</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {qadaPrompt.days} day{qadaPrompt.days > 1 ? 's' : ''} of this cycle fell in Ramadan.
                Missed Ramadan fasts are made up after (<a className="underline" href="https://sunnah.com/muslim:335" target="_blank" rel="noreferrer">Muslim 335</a>).
                Add {qadaPrompt.days > 1 ? 'them' : 'it'} to your qaḍā counter?
              </p>
              <div className="flex gap-2">
                <button className="flex-1 btn btn-sm rounded-xl bg-white/5 border-slate-400/10 text-white/60" onClick={() => setQadaPrompt(null)}>
                  Not now
                </button>
                <button className="flex-1 btn btn-sm rounded-xl border-0 text-white font-bold bg-gradient-to-r from-amber-500 to-orange-500"
                  disabled={updateFastingProfile.isPending} onClick={addQada}
                >
                  Add to qaḍā ✓
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedBackground>
  );
}
