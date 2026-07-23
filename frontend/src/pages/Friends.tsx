import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { streakVisual } from '../components/StatusBadges.js';
import { ClipboardDocumentIcon, CheckIcon, XMarkIcon, ChevronDownIcon, UserPlusIcon, UsersIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSocialSummary, useUnfriend, useFriendsList } from '../hooks/useSocial.js';

const RANK_BADGE = ['🥇', '🥈', '🥉'];

function Avatar({ name, photoUrl, size = 'w-10 h-10' }: { name: string; photoUrl?: string; size?: string }) {
  if (photoUrl) {
    return <img src={photoUrl} alt="" className={`${size} rounded-full object-cover ring-2 ring-white/15 shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full bg-brand-emerald/20 ring-2 ring-brand-emerald/30 grid place-items-center shrink-0`}>
      <span className="text-sm font-black text-brand-emerald">
        {name?.[0]?.toUpperCase() ?? '؟'}
      </span>
    </div>
  );
}

function formatConnectedSince(iso: string | null): string {
  if (!iso) return 'Connected a while ago';
  const d = new Date(iso);
  return `Connected since ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

/** Manage-friends modal: full list, connected-since date, two-step confirm delete. */
function ManageFriendsModal({ onClose }: { onClose: () => void }) {
  const { data: friends, isLoading } = useFriendsList(true);
  const unfriend = useUnfriend();
  // Two-step confirm: null → "confirm-1" (Remove?) → "confirm-2" (Are you sure?) → delete
  const [confirmStep, setConfirmStep] = useState<{ uid: string; step: 1 | 2 } | null>(null);

  const startConfirm = (uid: string) => setConfirmStep({ uid, step: 1 });
  const advanceConfirm = (uid: string) => setConfirmStep({ uid, step: 2 });
  const cancelConfirm = () => setConfirmStep(null);
  const finalizeRemove = (uid: string) => {
    unfriend.mutate(uid);
    setConfirmStep(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26 }}
        className="bg-brand-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-brand-emerald/30 space-y-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">👥</span>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">Your friends</h3>
              <p className="text-white/35 text-[11px]">
                {friends ? `${friends.length} connected` : 'Loading…'}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-white/30 hover:text-white p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-8">
            <span className="loading loading-spinner text-brand-emerald" />
          </div>
        ) : !friends || friends.length === 0 ? (
          <div className="text-center py-6 space-y-1.5">
            <p className="text-3xl">🌱</p>
            <p className="text-white/50 text-sm">No friends connected yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => {
              const confirming = confirmStep?.uid === f.uid;
              return (
                <div
                  key={f.uid}
                  className={`rounded-2xl border p-3 transition-colors ${
                    confirming ? 'border-red-500/40 bg-red-500/[0.06]' : 'border-emerald-500/10 bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={f.displayName} photoUrl={f.photoUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{f.displayName}</p>
                      <p className="text-white/35 text-[11px]">{formatConnectedSince(f.connectedSince)}</p>
                    </div>
                    {!confirming && (
                      <button
                        onClick={() => startConfirm(f.uid)}
                        aria-label={`Remove ${f.displayName}`}
                        title="Remove friend"
                        className="p-2 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {confirming && confirmStep?.step === 1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center justify-between gap-2">
                          <p className="text-white/60 text-xs">Remove {f.displayName} from your friends?</p>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={cancelConfirm} className="btn btn-xs btn-ghost text-white/50">Cancel</button>
                            <button
                              onClick={() => advanceConfirm(f.uid)}
                              className="btn btn-xs bg-red-500/80 hover:bg-red-500 text-white border-0"
                            >Remove</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {confirming && confirmStep?.step === 2 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-red-500/20 space-y-2">
                          <p className="text-red-300/90 text-xs font-semibold">
                            Are you sure? This removes the connection for both of you — {f.displayName} won't see your
                            stats anymore, and you'll need a new invite link to reconnect.
                          </p>
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={cancelConfirm} className="btn btn-xs btn-ghost text-white/50">Cancel</button>
                            <button
                              onClick={() => finalizeRemove(f.uid)}
                              disabled={unfriend.isPending}
                              className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-0"
                            >
                              {unfriend.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Yes, remove'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Friends() {
  const { data, isLoading, isError, refetch } = useSocialSummary();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  // The navbar "Connect a friend" button links to /friends?invite=1
  useEffect(() => {
    if (searchParams.get('invite') === '1') {
      setInviteOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const inviteLink = data?.inviteCode
    ? `${window.location.origin}/connect/${data.inviteCode}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `"So compete with one another in doing good." — Quran 2:148\n` +
        `Join me on Ihsan and let's encourage each other in worship 🌙\n${inviteLink}`
      );
      setCopied(true);
      toast.success('Invite copied — send it to a friend!', { id: 'invite-copy' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — long-press the link to copy it manually.');
    }
  };

  const leaderboard = data?.leaderboard ?? [];
  const friendsCount = Math.max(0, leaderboard.length - 1);
  const maxScore = Math.max(1, ...leaderboard.map((f) => f.score));

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Friends — Share Activities</h1>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-4">

          {/* ── Verse banner ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-4 space-y-1.5"
          >
            <motion.p
              className="text-xl sm:text-2xl font-black leading-snug bg-gradient-to-r from-brand-emerald via-teal-300 to-brand-gold bg-clip-text text-transparent"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 100%' }}
            >
              “So compete with one another in doing good.”
            </motion.p>
            <a href="https://quran.com/2/148" target="_blank" rel="noopener noreferrer"
              className="text-brand-gold/60 text-xs underline underline-offset-4 hover:text-brand-gold/90">
              Quran 2:148 ↗
            </a>
          </motion.div>

          {/* ── Leaderboard ── */}
          {isLoading ? (
            <div className="min-h-[30vh] grid place-items-center">
              <span className="loading loading-spinner loading-lg text-brand-emerald" />
            </div>
          ) : friendsCount === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-emerald-500/10 bg-white/[0.04] p-8 text-center space-y-3"
            >
              <p className="text-4xl">🌱</p>
              <p className="text-white/70 font-bold text-sm">No friends connected yet</p>
              <p className="text-white/35 text-xs max-w-xs mx-auto leading-relaxed">
                Invite a friend who uses Ihsan — the moment they open your link,
                you'll both appear here and can gently push each other toward good.
              </p>
              <button
                onClick={() => setInviteOpen(true)}
                className="btn btn-sm bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 gap-1.5"
              >
                <UserPlusIcon className="w-4 h-4" /> Connect a friend
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wide">
                  Today's circle <span className="normal-case font-normal">— you + {friendsCount} friend{friendsCount === 1 ? '' : 's'}</span>
                </p>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setManageOpen(true)}
                    className="flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold"
                  >
                    <UsersIcon className="w-3.5 h-3.5" /> See friends
                  </button>
                  <button
                    onClick={() => setInviteOpen(true)}
                    className="flex items-center gap-1 text-brand-emerald/70 hover:text-brand-emerald text-xs font-bold"
                  >
                    <UserPlusIcon className="w-3.5 h-3.5" /> Invite a friend
                  </button>
                </div>
              </div>
              {leaderboard.map((f, i) => {
                const sv = streakVisual(f.zikrState, f.zikrStreak);
                return (
                  <motion.div
                    key={f.uid}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.06 }}
                    className={`rounded-2xl border p-3.5 ${
                      f.isMe
                        ? 'border-brand-emerald/40 bg-brand-emerald/8'
                        : 'border-emerald-500/10 bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center text-lg font-black shrink-0">
                        {RANK_BADGE[i] ?? <span className="text-white/30 text-sm">{i + 1}</span>}
                      </span>
                      <Avatar name={f.displayName} photoUrl={f.photoUrl} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">
                          {f.displayName}
                          {f.isMe && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-brand-emerald/25 text-brand-emerald align-middle">you</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(f.score / maxScore) * 100}%` }}
                              transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: 'easeOut' }}
                              className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-brand-gold to-amber-300' : 'bg-brand-emerald/80'}`}
                            />
                          </div>
                          <span className="text-white/70 text-xs font-black tabular-nums w-10 text-right">✨{f.score}</span>
                        </div>
                      </div>
                    </div>
                    {/* Stat chips — prayer, zikr streak, today's zikr, fasted today, quran pages */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pl-10">
                      <span className="px-2 py-0.5 rounded-full bg-white/8 border border-emerald-500/10 text-[10px] font-bold text-white/60">
                        🕌 {f.salatToday}/5 prayers
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold text-white/70 ${sv.cls}`}>
                        <span className={sv.iconCls}>{sv.icon}</span> {f.zikrStreak}d zikr streak
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/8 border border-emerald-500/10 text-[10px] font-bold text-white/60">
                        📿 {f.zikrToday.toLocaleString()} zikr today
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                        f.fastedToday
                          ? 'bg-brand-gold/15 border-brand-gold/40 text-brand-gold'
                          : 'bg-white/8 border-emerald-500/10 text-white/35'
                      }`}>
                        🌙 {f.fastedToday ? 'fasting today' : 'not fasting'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/8 border border-emerald-500/10 text-[10px] font-bold text-white/60">
                        📖 {f.quranPagesToday}/{f.quranGoal} pages
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── How Noor works ── */}
          <div className="rounded-2xl border border-emerald-500/10 bg-white/[0.04] overflow-hidden">
            <button
              onClick={() => setHowOpen(!howOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
              aria-expanded={howOpen}
            >
              <p className="text-white/60 font-bold text-sm">✨ What is Noor?</p>
              <motion.span animate={{ rotate: howOpen ? 180 : 0 }} className="text-white/30">
                <ChevronDownIcon className="w-4 h-4" />
              </motion.span>
            </button>
            <AnimatePresence>
              {howOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 space-y-1.5 text-xs text-white/45 border-t border-emerald-500/5">
                    <p>
                      Noor (<span className="text-white/60">نور</span>, "light") is a gentle daily measure of
                      your worship — out of <b className="text-white/70">100</b>:
                    </p>
                    <p>🕌 <b className="text-white/60">50</b> — today's five prayers (10 each)</p>
                    <p>🔥 <b className="text-white/60">20</b> — your zikr streak (2 per day, up to 10 days)</p>
                    <p>📖 <b className="text-white/60">20</b> — today's Quran reading vs your daily goal</p>
                    <p>🌙 <b className="text-white/60">10</b> — fasting today</p>
                    <p className="pt-1">
                      🌸 On days when Allah Himself excuses a believer from salat or fasting — as He decreed
                      for our sisters — Noor flows from what remains open: dhikr, Quran, and ṣalawāt. The
                      maximum stays 100 for everyone, and no one can tell whose day was excused.
                    </p>
                    <p className="pt-1">
                      <b className="text-white/60">Today's Noor</b> starts fresh every day at Fajr.{' '}
                      <b className="text-white/60">All-time Noor</b> gathers each day's light and never resets.
                    </p>
                    <p className="text-white/25 pt-1 italic">
                      Only Allah knows the worth of any deed — this is friendly encouragement,
                      never judgement.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Invite modal ── */}
      <AnimatePresence>
        {inviteOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setInviteOpen(false); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 26 }}
              className="bg-brand-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-brand-emerald/30 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">🤝</span>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">Connect a friend</h3>
                    <p className="text-white/35 text-[11px]">One link — they open it, you're connected</p>
                  </div>
                </div>
                <button onClick={() => setInviteOpen(false)} aria-label="Close" className="text-white/30 hover:text-white p-1">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <p className="text-center text-sm font-bold text-brand-emerald/90 italic px-2">
                “So compete with one another in doing good.”
                <a href="https://quran.com/2/148" target="_blank" rel="noopener noreferrer"
                  className="block text-brand-gold/60 text-[10px] underline not-italic mt-1">Quran 2:148 ↗</a>
              </p>

              {isError ? (
                <div className="text-center space-y-3 py-2">
                  <p className="text-brand-gold/80 text-sm">
                    Couldn't load your invite link — the server may still be waking up.
                  </p>
                  <button
                    onClick={() => void refetch()}
                    className="btn btn-sm bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0"
                  >Try again</button>
                </div>
              ) : inviteLink ? (
                <>
                  <div className="flex gap-2">
                    <code className="flex-1 min-w-0 truncate px-3 py-2.5 rounded-xl bg-black/30 border border-emerald-500/10 text-brand-emerald/90 text-xs">
                      {inviteLink}
                    </code>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => void copyLink()}
                      className="btn btn-sm bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 gap-1.5 shrink-0 h-auto"
                    >
                      {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </motion.button>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-white/40 leading-relaxed">
                    <p>📤 Send it over WhatsApp, Messenger — anywhere.</p>
                    <p>🔗 The link stays the same — one link works for all your friends.</p>
                    <p>🔒 Friends see your streaks and daily worship — never your logs or notes. Remove anyone anytime from "See friends".</p>
                  </div>
                </>
              ) : (
                <div className="grid place-items-center py-4">
                  <span className="loading loading-spinner text-brand-emerald" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Manage friends modal ── */}
      <AnimatePresence>
        {manageOpen && <ManageFriendsModal onClose={() => setManageOpen(false)} />}
      </AnimatePresence>
    </AnimatedBackground>
  );
}
