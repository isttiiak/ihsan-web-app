import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import api, { getIdToken } from '../lib/api.js';
import { getHijriAdjustment, setHijriAdjustment, getHijriDate, formatHijriDate } from '../utils/islamicCalendar.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useUiStore } from '../store/useUiStore.js';
import AnimatedBackground from '../components/AnimatedBackground.js';
import ZikrLibrarySection from '../components/ZikrLibrarySection.js';
import { AiPanel, AiThinking, AiDisclaimer, AiBadge } from '../components/ai/AiFlair.js';
import { useAiSuggest, useAiWeekly } from '../hooks/useAi.js';
import {
  Cog6ToothIcon,
  SparklesIcon,
  MoonIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  LightBulbIcon,
  TrashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';


// ── Per-feature data deletion targets ─────────────────────────────────────────
const DATA_TARGETS = [
  { id: 'zikr',    label: 'Zikr data',    emoji: '📿', endpoint: '/api/zikr/all',    detail: 'All counts, daily history, goal & streak' },
  { id: 'salat',   label: 'Salat logs',   emoji: '🕌', endpoint: '/api/salat/all',   detail: 'Every prayer log and its analytics' },
  { id: 'fasting', label: 'Fasting data', emoji: '🌙', endpoint: '/api/fasting/all', detail: 'All fasts, qaḍā/kaffārah progress & vows' },
  { id: 'quran',   label: 'Quran data',   emoji: '📖', endpoint: '/api/quran/all',   detail: 'Reading logs, streak & khatm bookmark' },
  { id: 'cycle',   label: 'Rayhanah Cycle data', emoji: '🌸', endpoint: '/api/cycle/all', detail: 'All cycle history and settings — visible only to you' },
] as const;

function SectionCard({ icon, title, subtitle, delay, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          {icon}
          <h2 className="text-base sm:text-lg font-black text-white">{title}</h2>
        </div>
        {subtitle && <p className="text-white/35 text-xs mb-4">{subtitle}</p>}
        {!subtitle && <div className="mb-4" />}
        {children}
      </div>
    </motion.div>
  );
}

function Toggle({ checked, onChange, title, detail, accent = 'toggle-success' }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  detail: string;
  accent?: string;
}) {
  return (
    <label className="flex items-center gap-4 p-3 rounded-xl border border-brand-border bg-brand-deep/50 cursor-pointer hover:border-slate-400/20 transition-colors">
      <input
        type="checkbox"
        className={`toggle ${accent}`}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="min-w-0">
        <p className="font-semibold text-white/80 text-sm">{title}</p>
        <p className="text-white/35 text-xs leading-snug">{detail}</p>
      </div>
    </label>
  );
}

export default function Settings() {
  const { aiEnabled, setAiEnabled } = useAuthStore();
  const {
    reduceMotion, highContrast, showNoorAllTime, showNoorToday,
    setReduceMotion, setHighContrast, setShowNoorAllTime, setShowNoorToday,
  } = useUiStore();
  const queryClient = useQueryClient();

  const [hijriAdj, setHijriAdjState] = useState(getHijriAdjustment());
  const [savedLocation, setSavedLocation] = useState<string | null>(() => {
    try {
      const s = localStorage.getItem('ihsan_location');
      return s ? ((JSON.parse(s) as { name?: string }).name ?? 'Saved location') : null;
    } catch { return null; }
  });
  const aiSuggest = useAiSuggest();
  const aiWeekly = useAiWeekly();
  const [exporting, setExporting] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const applyHijriAdj = (days: number) => {
    setHijriAdjustment(days);
    setHijriAdjState(days);
  };

  // ── AI companion (encouragement only) ────────────────────────────────────────
  const runSuggest = () => {
    aiSuggest.mutate('A Muslim keeping daily zikr, salah, Quran and fasting habits in the Ihsan app.', {
      onError: () => toast.error('Naseeh is resting — try again in a moment.'),
    });
  };

  // Gather a light, privacy-safe stats snapshot for the weekly recap.
  const runWeekly = async () => {
    const idToken = await getIdToken();
    const base = import.meta.env.VITE_BACKEND_URL as string;
    const headers: Record<string, string> = idToken ? { Authorization: `Bearer ${idToken}` } : {};
    const j = async (p: string): Promise<any | null> => {
      try { const r = await fetch(`${base}${p}`, { headers }); return r.ok ? await r.json() : null; }
      catch { return null; }
    };
    const [zikr, quran] = await Promise.all([j('/api/zikr/summary'), j('/api/quran/summary')]);
    const stats = {
      zikrToday: zikr?.today?.total ?? 0,
      zikrStreak: quran ? undefined : undefined,
      quranStreakDays: quran?.streak ?? 0,
      quranAyatThisMonth: quran?.stats?.last30Units ?? 0,
      khatmsCompleted: quran?.profile?.khatmCount ?? 0,
    };
    aiWeekly.mutate(stats, { onError: () => toast.error('Naseeh is resting — try again in a moment.') });
  };

  // ── Data export / import ────────────────────────────────────────────────────
  const exportProfile = async () => {
    setExporting(true);
    const idToken = await getIdToken();
    try {
      const headers: Record<string, string> = idToken ? { Authorization: `Bearer ${idToken}` } : {};
      const [profileRes, zikrRes] = await Promise.allSettled([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, { headers }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/summary`, { headers }),
      ]);
      const profile = profileRes.status === 'fulfilled' && profileRes.value.ok
        ? await profileRes.value.json() as unknown : null;
      const zikr = zikrRes.status === 'fulfilled' && zikrRes.value.ok
        ? await zikrRes.value.json() as unknown : null;
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), profile, zikr }, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ihsan-export-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed. Check your connection and try again.');
    } finally {
      setExporting(false);
    }
  };

  // ── Excel (.xlsx) export ────────────────────────────────────────────────────
  const exportExcel = async () => {
    setExportingXlsx(true);
    const idToken = await getIdToken();
    const base = import.meta.env.VITE_BACKEND_URL as string;
    const headers: Record<string, string> = idToken ? { Authorization: `Bearer ${idToken}` } : {};
    const getJson = async (path: string): Promise<any | null> => {
      try { const r = await fetch(`${base}${path}`, { headers }); return r.ok ? await r.json() : null; }
      catch { return null; }
    };
    try {
      const XLSX = await import('xlsx');
      const [profile, zikr, quran, fasting] = await Promise.all([
        getJson('/api/user/me'),
        getJson('/api/zikr/summary'),
        getJson('/api/quran/summary'),
        getJson('/api/fasting/summary'),
      ]);

      const wb = XLSX.utils.book_new();
      const addSheet = (name: string, rows: Array<Record<string, unknown>>) => {
        if (!rows.length) return;
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name.slice(0, 31));
      };

      // Overview
      addSheet('Overview', [
        { Metric: 'Exported at', Value: new Date().toLocaleString() },
        { Metric: 'Name', Value: profile?.displayName ?? profile?.user?.displayName ?? '—' },
        { Metric: 'Email', Value: profile?.email ?? profile?.user?.email ?? '—' },
        { Metric: 'Zikr — lifetime total', Value: zikr?.totalCount ?? 0 },
        { Metric: 'Zikr — today', Value: zikr?.today?.total ?? 0 },
        { Metric: 'Quran — day streak', Value: quran?.streak ?? 0 },
        { Metric: 'Quran — khatms completed', Value: quran?.profile?.khatmCount ?? 0 },
        { Metric: 'Quran — āyāt all-time', Value: quran?.stats?.allTimeUnits ?? 0 },
      ]);

      // Zikr lifetime per type
      addSheet('Zikr (lifetime)', (zikr?.perType ?? []).map((t: { zikrType: string; total: number }) => ({
        Zikr: t.zikrType, LifetimeCount: t.total,
      })));

      // Quran top surahs
      addSheet('Quran top surahs', (quran?.topSurahs ?? []).map((t: { surah: number; completions: number }) => ({
        Surah: t.surah, TimesCompleted: t.completions,
      })));

      // Fasting recent logs
      addSheet('Fasting (recent)', (fasting?.logs ?? []).map((l: { date: string; category: string; status: string }) => ({
        Date: l.date, Category: l.category, Status: l.status,
      })));

      if (wb.SheetNames.length === 0) { toast.error('Nothing to export yet.'); return; }
      XLSX.writeFile(wb, `ihsan-export-${new Date().toISOString().substring(0, 10)}.xlsx`);
      toast.success('Excel file downloaded ✓');
    } catch {
      toast.error('Excel export failed. Check your connection and try again.');
    } finally {
      setExportingXlsx(false);
    }
  };

  const importProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as unknown;
      localStorage.setItem('ihsan_user', JSON.stringify(data));
      toast.success('Imported local profile cache — refresh to apply.');
    } catch {
      toast.error('Invalid file.');
    }
  };

  // ── Per-feature deletion (double confirm) ───────────────────────────────────
  const deleteData = async (target: (typeof DATA_TARGETS)[number]) => {
    setDeleting(target.id);
    try {
      await api.delete(target.endpoint);
      await queryClient.invalidateQueries();
      toast.success(`${target.label} deleted.`, { icon: '🗑️' });
    } catch {
      toast.error(`Could not delete ${target.label.toLowerCase()} — try again.`);
    } finally {
      setDeleting(null);
      setConfirmTarget(null);
    }
  };

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-4">

          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <Cog6ToothIcon className="w-7 h-7 text-brand-emerald" />
              <h1 className="text-2xl sm:text-3xl font-black text-brand-emerald">Settings</h1>
            </div>
            <p className="text-sm text-white/40">Everything under your control</p>
          </motion.div>

          {/* ── Noor display ── */}
          <SectionCard
            icon={<SparklesIcon className="w-5 h-5 text-brand-gold" />}
            title="Noor in the navbar"
            subtitle="Your daily light — always shown on the Friends page; turn these on to carry it everywhere"
            delay={0.05}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle
                checked={showNoorToday}
                onChange={setShowNoorToday}
                title="✨ Today's Noor"
                detail="Fresh every morning — resets at midnight"
                accent="toggle-success"
              />
              <Toggle
                checked={showNoorAllTime}
                onChange={setShowNoorAllTime}
                title="🌟 All-time Noor"
                detail="Every day's light gathered — never resets"
                accent="toggle-warning"
              />
            </div>
          </SectionCard>

          {/* ── Islamic calendar ── */}
          <SectionCard
            icon={<MoonIcon className="w-5 h-5 text-brand-gold" />}
            title="Hijri date adjustment"
            subtitle="Match your local moon sighting — affects special days and fasting rules everywhere"
            delay={0.1}
          >
            <div className="flex items-center gap-2">
              {[-1, 0, 1].map((d) => (
                <button
                  key={d}
                  onClick={() => applyHijriAdj(d)}
                  className={`btn btn-sm flex-1 border ${
                    hijriAdj === d
                      ? 'bg-brand-emerald text-white border-brand-emerald'
                      : 'bg-brand-deep text-white/50 border-brand-border hover:text-white'
                  }`}
                >
                  {d === 0 ? 'Default' : d > 0 ? '+1 day' : '−1 day'}
                </button>
              ))}
            </div>
            <p className="text-brand-gold/60 text-xs mt-3">
              Today: {(() => { const h = getHijriDate(); return h ? formatHijriDate(h) : '—'; })()}
              <span className="text-white/30"> · Bangladesh, India &amp; Pakistan are often −1 day from the default (Umm al-Qura) calendar</span>
            </p>
          </SectionCard>

          {/* ── Accessibility ── */}
          <SectionCard
            icon={<EyeIcon className="w-5 h-5 text-cyan-300" />}
            title="Accessibility"
            delay={0.15}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle
                checked={reduceMotion}
                onChange={setReduceMotion}
                title="Reduce animations"
                detail="Tone down motion effects and celebrations"
              />
              <Toggle
                checked={highContrast}
                onChange={setHighContrast}
                title="High contrast"
                detail="Stronger text and focus outlines"
                accent="toggle-warning"
              />
            </div>
          </SectionCard>

          {/* ── AI companion (Naseeh) ── */}
          <SectionCard
            icon={<LightBulbIcon className="w-5 h-5 text-fuchsia-400" />}
            title="Naseeh — your AI companion"
            subtitle="Gentle encouragement & reflection — never a source of religious evidence"
            delay={0.2}
          >
            <Toggle
              checked={aiEnabled}
              onChange={setAiEnabled}
              title="Enable Naseeh"
              detail="Personalised encouragement, dhikr ideas & a weekly reflection"
            />
            {aiEnabled && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-sm border-0 text-white gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90"
                    onClick={runSuggest}
                    disabled={aiSuggest.isPending}
                  >
                    <SparklesIcon className="w-4 h-4" /> Personalised dhikr
                  </button>
                  <button
                    className="btn btn-sm border-0 text-white gap-2 bg-gradient-to-r from-cyan-500 to-emerald-600 hover:opacity-90"
                    onClick={() => void runWeekly()}
                    disabled={aiWeekly.isPending}
                  >
                    <SparklesIcon className="w-4 h-4" /> Weekly reflection
                  </button>
                </div>

                {(aiSuggest.isPending || aiSuggest.data) && (
                  <AiPanel>
                    <div className="p-4">
                      <AiBadge />
                      {aiSuggest.isPending ? <AiThinking label="Naseeh is choosing your dhikr…" /> : (
                        <div className="mt-2 space-y-1.5">
                          {(aiSuggest.data?.suggestions ?? []).map((s, i) => (
                            <p key={i} className="text-white/80 text-sm">📿 {s}</p>
                          ))}
                          {aiSuggest.data?.motivation && (
                            <p className="text-fuchsia-200/80 text-sm italic pt-1">{aiSuggest.data.motivation}</p>
                          )}
                        </div>
                      )}
                      <AiDisclaimer />
                    </div>
                  </AiPanel>
                )}

                {(aiWeekly.isPending || aiWeekly.data) && (
                  <AiPanel>
                    <div className="p-4">
                      <AiBadge label="Naseeh · weekly reflection" />
                      {aiWeekly.isPending ? <AiThinking label="Naseeh is looking over your week…" /> : (
                        <div className="mt-2 space-y-1.5">
                          <p className="text-white/80 text-sm leading-relaxed">{aiWeekly.data?.summary}</p>
                          <p className="text-cyan-200/80 text-sm italic">{aiWeekly.data?.encouragement}</p>
                        </div>
                      )}
                      <AiDisclaimer />
                    </div>
                  </AiPanel>
                )}
              </div>
            )}
          </SectionCard>

          {/* ── Zikr library ── */}
          <SectionCard
            icon={<span className="text-lg">📿</span>}
            title="Zikr library"
            subtitle="Ṣalawāt, istighfār, the weighty words — verified adhkār to add to your counter"
            delay={0.22}
          >
            <ZikrLibrarySection />
          </SectionCard>

          {/* ── Your data ── */}
          <SectionCard
            icon={<ShieldCheckIcon className="w-5 h-5 text-brand-emerald" />}
            title="Your data"
            subtitle="It's yours — take it with you or remove it, feature by feature"
            delay={0.25}
          >
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                className="btn btn-sm bg-brand-deep border border-brand-border text-white/70 hover:text-white gap-2"
                onClick={() => void exportProfile()}
                disabled={exporting}
              >
                {exporting ? <span className="loading loading-spinner loading-xs" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                Export my data (JSON)
              </button>
              <button
                className="btn btn-sm bg-brand-deep border border-brand-border text-white/70 hover:text-white gap-2"
                onClick={() => void exportExcel()}
                disabled={exportingXlsx}
              >
                {exportingXlsx ? <span className="loading loading-spinner loading-xs" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                Export as Excel (.xlsx)
              </button>
              <label className="btn btn-sm bg-brand-deep border border-brand-border text-white/70 hover:text-white gap-2 cursor-pointer">
                <ArrowUpTrayIcon className="w-4 h-4" />
                Import
                <input type="file" accept="application/json" className="hidden" onChange={(e) => void importProfile(e)} />
              </label>
            </div>

            {/* Saved prayer location (stored only in this browser) */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-brand-border bg-brand-deep/40 mb-5">
              <span className="text-lg shrink-0">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm font-semibold">Prayer times location</p>
                <p className="text-white/30 text-[11px] truncate">
                  {savedLocation ? `${savedLocation} — stored only in this browser` : 'Not set — choose one on the Prayer Times page'}
                </p>
              </div>
              {savedLocation && (
                <button
                  onClick={() => {
                    localStorage.removeItem('ihsan_location');
                    setSavedLocation(null);
                    toast.success('Saved location cleared.');
                  }}
                  className="btn btn-xs btn-ghost text-white/40 hover:text-red-400 shrink-0"
                >Clear</button>
              )}
            </div>

            <p className="text-red-400/70 text-[11px] uppercase tracking-widest font-bold mb-2">Danger zone — cannot be undone</p>
            <div className="space-y-2">
              {DATA_TARGETS.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-red-500/15 bg-red-500/[0.04]">
                  <span className="text-lg shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm font-semibold">{t.label}</p>
                    <p className="text-white/30 text-[11px]">{t.detail}</p>
                  </div>
                  {confirmTarget === t.id ? (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => void deleteData(t)}
                        disabled={deleting === t.id}
                        className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-0"
                      >
                        {deleting === t.id ? <span className="loading loading-spinner loading-xs" /> : 'Yes, delete'}
                      </button>
                      <button onClick={() => setConfirmTarget(null)} className="btn btn-xs btn-ghost text-white/50">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmTarget(t.id)}
                      aria-label={`Delete ${t.label}`}
                      className="btn btn-xs btn-ghost text-red-400/60 hover:text-red-400 hover:bg-red-500/10 gap-1 shrink-0"
                    >
                      <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-white/25 text-[10px] mt-3">
              Account details (name, photo, email) are managed from your <a href="/profile" className="underline text-white/40">Profile</a> page.
            </p>
          </SectionCard>

        </div>
      </div>
    </AnimatedBackground>
  );
}
