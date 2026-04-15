import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useSalatLog, useUpdatePrayer, PrayerId, PrayerStatus } from '../hooks/useSalatLog.js';
import { PRAYER_META } from '../utils/prayerTimes.js';

interface StatusOption {
  value: PrayerStatus;
  label: string;
  emoji: string;
  bg: string;
  border: string;
  text: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'prayed',  label: 'Prayed',    emoji: '✅', bg: 'bg-brand-emerald/20',  border: 'border-brand-emerald/60', text: 'text-brand-emerald' },
  { value: 'mosque',  label: 'Mosque',    emoji: '🕌', bg: 'bg-cyan-500/20',        border: 'border-cyan-400/60',      text: 'text-cyan-400' },
  { value: 'kaza',    label: 'Kaza',      emoji: '⏰', bg: 'bg-brand-gold/20',      border: 'border-brand-gold/60',    text: 'text-brand-gold' },
  { value: 'missed',  label: 'Missed',    emoji: '❌', bg: 'bg-red-500/20',          border: 'border-red-400/60',       text: 'text-red-400' },
  { value: 'pending', label: 'Not logged', emoji: '⬜', bg: 'bg-brand-surface',      border: 'border-brand-border',     text: 'text-white/40' },
];

function statusStyle(status: PrayerStatus): StatusOption {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[STATUS_OPTIONS.length - 1];
}

export default function SalatTracker() {
  const navigate = useNavigate();
  const today = new Date().toISOString().substring(0, 10);
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerId | null>(null);

  const { data: log, isLoading } = useSalatLog();
  const updatePrayer = useUpdatePrayer();

  const prayers = PRAYER_META.filter((p) => p.isTrackable);

  const completedCount = log
    ? prayers.filter((p) => {
        const s = log.prayers[p.id as PrayerId]?.status;
        return s === 'prayed' || s === 'mosque';
      }).length
    : 0;

  const handleSelect = (prayer: PrayerId, status: PrayerStatus) => {
    updatePrayer.mutate({ prayer, status, date: today });
    setExpandedPrayer(null);
  };

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-6">

          {/* Back + Analytics nav */}
          <div className="flex items-center justify-between">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/90 backdrop-blur-md border border-brand-border text-white text-sm font-semibold shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back
            </motion.button>
            <motion.button
              onClick={() => navigate('/salat/analytics')}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/90 backdrop-blur-md border border-brand-border text-white text-sm font-semibold"
            >
              <ChartBarIcon className="w-4 h-4" /> Analytics
            </motion.button>
          </div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-brand-emerald mb-1">Salat Tracker</h1>
            <p className="text-white/50 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-gradient-to-br from-brand-emerald/15 to-brand-deep border border-brand-emerald/20 rounded-2xl"
          >
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm font-semibold uppercase tracking-wide">Today's Progress</span>
                <span className="text-2xl font-black text-brand-emerald">
                  {completedCount}<span className="text-white/40 font-normal text-lg">/5</span>
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-emerald to-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / 5) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <p className="text-white/40 text-xs mt-2">
                {completedCount === 5 ? '🎉 All prayers completed — MashaAllah!' : `${5 - completedCount} prayer${5 - completedCount !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
          </motion.div>

          {/* Prayer cards */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-brand-emerald" />
            </div>
          ) : (
            <div className="space-y-3">
              {prayers.map((prayer, i) => {
                const prayerId = prayer.id as PrayerId;
                const status = log?.prayers[prayerId]?.status ?? 'pending';
                const style = statusStyle(status);
                const isExpanded = expandedPrayer === prayerId;

                return (
                  <motion.div
                    key={prayer.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    layout
                    className={`card rounded-2xl border overflow-hidden transition-colors ${style.bg} ${style.border}`}
                  >
                    {/* Main row */}
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedPrayer(isExpanded ? null : prayerId)}
                    >
                      <div className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{prayer.icon}</span>
                          <div>
                            <p className={`font-bold text-base ${style.text}`}>{prayer.name}</p>
                            <p className="text-white/40 text-xs capitalize">{status === 'pending' ? 'Tap to log' : style.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{style.emoji}</span>
                          <span className={`text-xs font-bold uppercase tracking-wide ${isExpanded ? 'text-white/60' : 'text-white/30'}`}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Status selector */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {STATUS_OPTIONS.filter((s) => s.value !== 'pending').map((opt) => (
                              <motion.button
                                key={opt.value}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handleSelect(prayerId, opt.value)}
                                disabled={updatePrayer.isPending}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border font-semibold text-sm transition-all ${
                                  status === opt.value
                                    ? `${opt.bg} ${opt.border} ${opt.text} ring-2 ring-offset-1 ring-offset-brand-deep ring-white/20`
                                    : 'bg-brand-deep border-brand-border text-white/60 hover:border-white/30'
                                }`}
                              >
                                <span className="text-xl">{opt.emoji}</span>
                                <span>{opt.label}</span>
                              </motion.button>
                            ))}
                            {status !== 'pending' && (
                              <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handleSelect(prayerId, 'pending')}
                                disabled={updatePrayer.isPending}
                                className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-brand-deep border-brand-border text-white/30 hover:border-white/20 text-sm font-semibold"
                              >
                                <span className="text-xl">↩️</span>
                                <span>Clear</span>
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="card bg-brand-surface border border-brand-border rounded-2xl"
          >
            <div className="card-body p-4">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">Status Legend</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.filter((s) => s.value !== 'pending').map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <span>{opt.emoji}</span>
                    <span className={`text-xs font-medium ${opt.text}`}>{opt.label}</span>
                    <span className="text-white/20 text-xs">—</span>
                    <span className="text-white/30 text-xs">
                      {opt.value === 'prayed' && 'On time'}
                      {opt.value === 'mosque' && 'In congregation'}
                      {opt.value === 'kaza' && 'Made up later'}
                      {opt.value === 'missed' && 'Not prayed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </AnimatedBackground>
  );
}
