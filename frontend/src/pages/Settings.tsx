import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n, { LANGUAGES } from '../i18n.js';
import { useQueryClient } from '@tanstack/react-query';
import api, { API_BASE, getIdToken } from '../lib/api.js';
import { getHijriAdjustment, setHijriAdjustment, getHijriToday, formatHijriDate } from '../utils/islamicCalendar.js';
import { syncQuranTranslationWithLang } from '../utils/quranData.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useUiStore } from '../store/useUiStore.js';
import AnimatedBackground from '../components/AnimatedBackground.js';
import ZikrLibrarySection from '../components/ZikrLibrarySection.js';
import {
  Cog6ToothIcon,
  SparklesIcon,
  MoonIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  ShieldCheckIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline';


// ── Unified danger zone (Istiak's spec): EVERY data-erase control lives here,
// grouped per feature, with full AND partial options. ─────────────────────────
interface DangerRow {
  id: string;
  label: string;
  detail: string;
  method: 'delete' | 'post' | 'patch';
  endpoint: string;
  body?: Record<string, unknown>;
  /** partial action (indented under the group's "everything" row) */
  sub?: boolean;
}
interface DangerGroup {
  id: string;
  emoji: string;
  title: string;
  /** colored-card classes so groups are recognizable at a glance */
  card: string;
  rows: DangerRow[];
}

const DANGER_GROUPS: DangerGroup[] = [
  {
    id: 'zikr', emoji: '📿', title: 'Zikr', card: 'border-brand-emerald/20 bg-brand-emerald/[0.04]',
    rows: [
      { id: 'zikr-all', label: 'All zikr data', detail: 'Counts, daily history, goal & streak', method: 'delete', endpoint: '/api/zikr/all' },
    ],
  },
  {
    id: 'salat', emoji: '🕌', title: 'Salat', card: 'border-brand-info/20 bg-brand-info/[0.04]',
    rows: [
      { id: 'salat-all', label: 'All salat logs', detail: 'Every prayer log and its analytics', method: 'delete', endpoint: '/api/salat/all' },
    ],
  },
  {
    id: 'fasting', emoji: '🌙', title: 'Fasting', card: 'border-brand-gold/20 bg-brand-gold/[0.04]',
    rows: [
      { id: 'fasting-all', label: 'All fasting data', detail: 'Every fast, qaḍā/kaffārah progress & vows', method: 'delete', endpoint: '/api/fasting/all' },
      { id: 'fasting-qada', label: 'Qaḍā only', detail: 'Make-up fast logs + the owed counter', method: 'delete', endpoint: '/api/fasting/category/qada', sub: true },
      { id: 'fasting-kaffarah', label: 'Kaffārah only', detail: 'Expiation logs + its settings', method: 'delete', endpoint: '/api/fasting/category/kaffarah', sub: true },
      { id: 'fasting-voluntary', label: 'Voluntary only', detail: 'Mon/Thu, white days, Arafah… logs', method: 'delete', endpoint: '/api/fasting/category/voluntary', sub: true },
      { id: 'fasting-ramadan', label: 'Ramadan only', detail: 'Ramadan tracker logs (incl. tarawih)', method: 'delete', endpoint: '/api/fasting/category/ramadan', sub: true },
      { id: 'fasting-vows', label: 'Vows (nadhr) only', detail: 'Vow fasts + the vow list itself', method: 'delete', endpoint: '/api/fasting/category/nadhr', sub: true },
    ],
  },
  {
    id: 'quran', emoji: '📖', title: 'Quran', card: 'border-brand-info/20 bg-brand-info/[0.04]',
    rows: [
      { id: 'quran-all', label: 'All Quran data', detail: 'Reading logs, streak, bookmarks & khatm', method: 'delete', endpoint: '/api/quran/all' },
      { id: 'quran-khatam', label: 'Reset khatam journey', detail: 'Bookmark → 1:1, journey un-starts; completed count stays', method: 'post', endpoint: '/api/quran/khatam/reset', sub: true },
      { id: 'quran-goal', label: 'Remove reading goal', detail: 'Back to no daily target; history stays', method: 'patch', endpoint: '/api/quran/profile', body: { dailyGoalAyat: 0 }, sub: true },
    ],
  },
  {
    id: 'cycle', emoji: '🌸', title: 'Rayhanah Cycle', card: 'border-brand-pink/20 bg-brand-pink/[0.04]',
    rows: [
      { id: 'cycle-all', label: 'All cycle data', detail: 'History, wellness notes & settings — visible only to you', method: 'delete', endpoint: '/api/cycle/all' },
    ],
  },
];

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
        {subtitle && <p className="text-white/30 text-xs mb-4">{subtitle}</p>}
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
    <label className="flex items-center gap-4 p-3 rounded-xl border border-brand-border bg-brand-deep/50 cursor-pointer hover:border-brand-emerald/20 transition-colors">
      <input
        type="checkbox"
        className={`toggle ${accent}`}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="min-w-0">
        <p className="font-semibold text-white/80 text-sm">{title}</p>
        <p className="text-white/30 text-xs leading-snug">{detail}</p>
      </div>
    </label>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  // Rayhanah is a sisters-only feature — its delete group must not appear for
  // anyone else (a brother seeing a 🌸 cycle-data row was a bug).
  const dangerGroups = DANGER_GROUPS.filter((g) => g.id !== 'cycle' || user?.gender === 'female');
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
  const [exporting, setExporting] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const applyHijriAdj = (days: number) => {
    setHijriAdjustment(days);
    setHijriAdjState(days);
    if (user) api.patch('/api/user/me', { hijriOffset: days }).catch(() => {});
  };

  // ── Data export / import ────────────────────────────────────────────────────
  // ── Full-account backup: EVERYTHING in one file (v4.9 rebuild) ──────────────
  const exportProfile = async () => {
    setExporting(true);
    try {
      const { data } = await api.get<{ ok: boolean; backup: unknown }>('/api/user/export');
      const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ihsan-backup-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded — keep it somewhere safe 📦');
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
    const base = API_BASE;
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

  // ── Restore from an Ihsan backup .json — merge, imported days win ───────────
  const importProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text()) as { app?: string; version?: number };
      if (parsed?.app !== 'ihsan' || parsed?.version !== 1) {
        toast.error('That is not an Ihsan backup file — export one from this page first.');
        return;
      }
      const { data } = await api.post<{ ok: boolean; counts: Record<string, number> }>('/api/user/import', parsed);
      await queryClient.invalidateQueries();
      const c = data.counts ?? {};
      toast.success(
        `Restored: ${c.zikrDays ?? 0} zikr · ${c.salatDays ?? 0} salat · ${c.fastingDays ?? 0} fasting · ${c.quranDays ?? 0} quran day(s) ✅`,
        { duration: 6000 }
      );
    } catch {
      toast.error('Import failed — the file may be damaged, or the connection dropped.');
    } finally {
      setImporting(false);
    }
  };

  // ── Danger-zone executor (full + partial actions, double confirm) ──────────
  const runDanger = async (row: DangerRow) => {
    setDeleting(row.id);
    try {
      if (row.method === 'delete') await api.delete(row.endpoint);
      else if (row.method === 'post') await api.post(row.endpoint, row.body ?? {});
      else await api.patch(row.endpoint, row.body ?? {});
      await queryClient.invalidateQueries();
      toast.success(`${row.label} — done.`, { icon: '🗑️' });
    } catch {
      toast.error(`Could not complete "${row.label}" — try again.`);
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
              <h1 className="text-2xl sm:text-3xl font-black text-brand-emerald">{t('settings.title')}</h1>
            </div>
            <p className="text-sm text-white/40">{t('settings.subtitle')}</p>
          </motion.div>

          {/* ── Language — kept at the very top so it's the first thing found ── */}
          <SectionCard
            icon={<LanguageIcon className="w-5 h-5 text-brand-emerald" />}
            title={`🌐 ${t('settings.language')}`}
            subtitle={t('settings.languageSubtitle')}
            delay={0.03}
          >
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { void i18n.changeLanguage(l.id); syncQuranTranslationWithLang(l.id); }}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    i18n.resolvedLanguage === l.id
                      ? 'bg-brand-emerald/20 border-brand-emerald/50 text-brand-emerald'
                      : 'bg-brand-deep/50 border-brand-border text-white/60 hover:border-brand-emerald/30'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-white/25 text-[10px] mt-3 leading-relaxed">
              {t('settings.languageNote')}
            </p>
          </SectionCard>

          {/* ── Noor display ── */}
          <SectionCard
            icon={<SparklesIcon className="w-5 h-5 text-brand-gold" />}
            title={t('settings.noorSection')}
            subtitle={t('settings.noorSubtitle')}
            delay={0.05}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle
                checked={showNoorToday}
                onChange={setShowNoorToday}
                title={`✨ ${t('settings.noorToday')}`}
                detail={t('settings.noorTodayDetail')}
                accent="toggle-success"
              />
              <Toggle
                checked={showNoorAllTime}
                onChange={setShowNoorAllTime}
                title={`🌟 ${t('settings.noorAllTime')}`}
                detail={t('settings.noorAllTimeDetail')}
                accent="toggle-warning"
              />
            </div>
          </SectionCard>

          {/* ── Islamic calendar ── */}
          <SectionCard
            icon={<MoonIcon className="w-5 h-5 text-brand-gold" />}
            title={t('settings.hijriSection')}
            subtitle={t('settings.hijriSubtitle')}
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
                  {d === 0 ? t('settings.hijriDefault') : d > 0 ? t('settings.hijriPlus') : t('settings.hijriMinus')}
                </button>
              ))}
            </div>
            <p className="text-brand-gold/60 text-xs mt-3">
              Today: {(() => { const h = getHijriToday(); return h ? formatHijriDate(h) : '—'; })()}
              <span className="text-white/30"> · {t('settings.hijriNote')}</span>
            </p>
          </SectionCard>

          {/* ── Accessibility ── */}
          <SectionCard
            icon={<EyeIcon className="w-5 h-5 text-brand-info" />}
            title={t('settings.accessibilitySection')}
            delay={0.15}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle
                checked={reduceMotion}
                onChange={setReduceMotion}
                title={t('settings.reduceMotion')}
                detail={t('settings.reduceMotionDetail')}
              />
              <Toggle
                checked={highContrast}
                onChange={setHighContrast}
                title={t('settings.highContrast')}
                detail={t('settings.highContrastDetail')}
                accent="toggle-warning"
              />
            </div>
          </SectionCard>

          {/* ── Naseeh AI companion ── */}
          <SectionCard
            icon={<SparklesIcon className="w-5 h-5 text-brand-gold" />}
            title={t('settings.naseehSection')}
            subtitle={t('settings.naseehSubtitle')}
            delay={0.18}
          >
            <Toggle
              checked={aiEnabled}
              onChange={(v) => {
                setAiEnabled(v);
                if (user) api.patch('/api/user/me', { aiEnabled: v }).catch(() => {});
              }}
              title={t('settings.enableNaseeh')}
              detail={t('settings.enableNaseehDetail')}
              accent="toggle-warning"
            />
          </SectionCard>

          {/* ── Zikr library ── */}
          <SectionCard
            icon={<span className="text-lg">📿</span>}
            title={t('settings.zikrLibrary')}
            subtitle={t('settings.zikrLibrarySubtitle')}
            delay={0.22}
          >
            <ZikrLibrarySection />
          </SectionCard>

          {/* ── Your data ── */}
          <SectionCard
            icon={<ShieldCheckIcon className="w-5 h-5 text-brand-emerald" />}
            title={t('settings.dataSection')}
            subtitle={t('settings.dataSubtitle')}
            delay={0.25}
          >
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                className="btn btn-sm bg-brand-deep border border-brand-border text-white/70 hover:text-white gap-2"
                onClick={() => void exportProfile()}
                disabled={exporting}
              >
                {exporting ? <span className="loading loading-spinner loading-xs" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                {t('settings.fullBackup')}
              </button>
              <button
                className="btn btn-sm bg-brand-deep border border-brand-border text-white/70 hover:text-white gap-2"
                onClick={() => void exportExcel()}
                disabled={exportingXlsx}
              >
                {exportingXlsx ? <span className="loading loading-spinner loading-xs" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                {t('settings.exportExcel')}
              </button>
              <label className={`btn btn-sm bg-brand-deep border border-brand-border text-white/70 hover:text-white gap-2 cursor-pointer ${importing ? 'pointer-events-none opacity-60' : ''}`}>
                {importing ? <span className="loading loading-spinner loading-xs" /> : <ArrowUpTrayIcon className="w-4 h-4" />}
                {t('settings.restoreBackup')}
                <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => void importProfile(e)} />
              </label>
            </div>
            <p className="text-white/30 text-[11px] mb-4 leading-relaxed">
              {t('settings.backupNote')}{user?.gender === 'female' ? t('settings.backupNoteCycle') : ''}
            </p>

            {/* Saved prayer location (stored only in this browser) */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-brand-border bg-brand-deep/40 mb-5">
              <span className="text-lg shrink-0">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm font-semibold">{t('settings.prayerLocation')}</p>
                <p className="text-white/30 text-[11px] truncate">
                  {savedLocation ? t('settings.locationSet', { name: savedLocation }) : t('settings.locationNotSet')}
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
                >{t('settings.clearLocation')}</button>
              )}
            </div>

            {/* separator: everything below is destructive (Istiak's spec) */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-red-500/25" />
              <span className="text-red-400/80 text-[11px] uppercase tracking-widest font-bold">⚠️ {t('settings.dangerZone')}</span>
              <div className="flex-1 border-t border-red-500/25" />
            </div>
            <div className="rounded-2xl bg-red-500/[0.08] border border-red-500/25 p-3 space-y-3">
              <p className="text-red-300/60 text-[11px]">{t('settings.dangerNote')}</p>
              {dangerGroups.map((g) => (
                <div key={g.id} className={`rounded-2xl border ${g.card} p-3 space-y-1.5`}>
                  <p className="text-white/70 text-xs font-black">{g.emoji} {g.title}</p>
                  {g.rows.map((row) => (
                    <div key={row.id} className={`flex items-center gap-3 py-1.5 ${row.sub ? 'pl-4 border-l-2 border-white/5 ml-1' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${row.sub ? 'text-white/50' : 'text-white/75 font-semibold'}`}>{row.label}</p>
                        <p className="text-white/30 text-[11px]">{row.detail}</p>
                      </div>
                      {confirmTarget === row.id ? (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => void runDanger(row)}
                            disabled={deleting === row.id}
                            className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-0"
                          >
                            {deleting === row.id ? <span className="loading loading-spinner loading-xs" /> : t('settings.yesDoIt')}
                          </button>
                          <button onClick={() => setConfirmTarget(null)} className="btn btn-xs btn-ghost text-white/50">
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmTarget(row.id)}
                          aria-label={row.label}
                          className="btn btn-xs btn-ghost text-red-400/60 hover:text-red-400 hover:bg-red-500/10 gap-1 shrink-0"
                        >
                          <TrashIcon className="w-3.5 h-3.5" /> {row.method === 'delete' ? t('common.delete') : row.id === 'quran-khatam' ? t('common.reset') : t('common.remove')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-white/25 text-[10px] mt-3">
              {t('settings.accountNote')}
            </p>
          </SectionCard>

        </div>
      </div>
    </AnimatedBackground>
  );
}
