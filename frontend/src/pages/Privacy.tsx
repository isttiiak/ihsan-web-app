import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';

const SECTIONS = [
  {
    emoji: '📥',
    title: 'What we store',
    body: [
      'Account basics — your email, display name, and optional profile photo (via Firebase Authentication).',
      'Your worship records — zikr counts, prayer logs, fasting logs, Quran reading progress, goals and vows — stored in our database so they sync across your devices.',
      'A friends list and an invite code, if you use the Friends feature.',
      'Rayhanah Cycle dates (start/end), if you use it — visible ONLY to you, never to friends. On the leaderboard your Noor simply flows from the dhikr, Quran and salawat you do, indistinguishable from any other day. Delete it anytime from Settings.',
    ],
  },
  {
    emoji: '📍',
    title: 'What never leaves your device',
    body: [
      'Your location for prayer times is stored only in your browser (localStorage) and is never sent to our servers — all prayer-time calculations happen on your device.',
      'Interface preferences (Hijri adjustment, Noor display, accessibility settings) also live only in your browser.',
    ],
  },
  {
    emoji: '🤝',
    title: 'What friends can see',
    body: [
      'Connecting is always mutual and only happens when someone opens your invite link.',
      'Friends see summary stats only: your zikr streak and today’s count, prayers completed today, whether you are fasting today, Quran pages vs goal, and your Noor.',
      'They never see your individual logs, notes, history, or location. Remove a friend anytime — the connection is deleted on both sides.',
    ],
  },
  {
    emoji: '📊',
    title: 'Analytics',
    body: [
      'We use Google Analytics 4 to understand basic usage — pages visited, country-level location, and how people find the app. IP addresses are anonymized.',
      'Analytics never receives your worship data, your name, or your email.',
    ],
  },
  {
    emoji: '🚫',
    title: 'What we will never do',
    body: [
      'No ads. No selling or sharing your data with third parties. No tracking beyond the basic analytics above.',
      'Your worship is between you and Allah — we treat the records of it as an amanah (trust).',
    ],
  },
  {
    emoji: '🗑️',
    title: 'Your control',
    body: [
      'Export your data as JSON from Settings at any time.',
      'Delete any feature’s data permanently from Settings → Your data (zikr, salat, fasting, or Quran) — deletions are immediate and irreversible.',
      'To delete your entire account, contact us and we will remove everything.',
    ],
  },
  {
    emoji: '🔐',
    title: 'How it’s protected',
    body: [
      'Authentication is handled by Firebase (Google); we never see or store your password.',
      'All traffic is encrypted (HTTPS). API access requires your personal token, and every request is validated.',
      'Data is stored on MongoDB Atlas with access restricted to the application.',
    ],
  },
];

export default function Privacy() {
  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Privacy Policy</h1>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-4 pb-10">

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 space-y-2">
            <p className="text-5xl">🔒</p>
            <h2 className="text-3xl font-black text-white">Privacy</h2>
            <p className="text-white/45 text-sm max-w-md mx-auto leading-relaxed">
              Plain words, no legal maze: here is exactly what Ihsan stores, what it never touches,
              and how you stay in control.
            </p>
            <p className="text-white/25 text-xs">Last updated: July 10, 2026</p>
          </motion.div>

          {SECTIONS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.05 }}
              className="rounded-2xl border border-slate-400/10 bg-white/[0.04] p-5"
            >
              <p className="text-white font-bold text-sm mb-2">{s.emoji} {s.title}</p>
              <ul className="space-y-1.5">
                {s.body.map((line, j) => (
                  <li key={j} className="text-white/45 text-xs leading-relaxed pl-3 border-l-2 border-slate-400/10">{line}</li>
                ))}
              </ul>
            </motion.div>
          ))}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center pt-4 space-y-2">
            <p className="text-white/40 text-xs">
              Questions or account deletion requests:{' '}
              <a href="mailto:isttiiak@gmail.com" className="text-brand-emerald underline">isttiiak@gmail.com</a>
            </p>
            <Link to="/about" className="text-white/30 text-xs underline hover:text-white/60">About Ihsan →</Link>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
