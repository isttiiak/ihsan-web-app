import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';

const FEATURES = [
  { emoji: '📿', title: 'Zikr Counter', desc: 'A local-first tasbih with daily goals and a forgiving streak — miss a day and you still get a chance to recover it.' },
  { emoji: '🕌', title: 'Salat Tracker', desc: 'All five prayers with on-time/kaza states, congregation tracking, nafl prayers, and honest analytics.' },
  { emoji: '🕐', title: 'Prayer Times', desc: 'Calculated entirely on your device from your location — nothing is sent to any server.' },
  { emoji: '🌙', title: 'Fasting Tracker', desc: 'Fiqh-aware: qaḍā, kaffārah and vows alongside every sunnah day — and it blocks the days fasting is forbidden.' },
  { emoji: '📖', title: 'Quran Habit', desc: 'A gentle daily-minimum goal, reading streaks, and a khatm journey across the whole mushaf.' },
  { emoji: '🤝', title: 'Friends', desc: 'Connect with one link and encourage each other with Noor — a calm daily measure of worship.' },
];

export default function About() {
  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">About Ihsan</h1>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-5 pb-10">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 space-y-3">
            <p className="text-5xl">🕌</p>
            <h2 className="text-3xl font-black text-white">About Ihsan</h2>
            <p className="font-arabic text-brand-gold/70 text-xl">الإحسان</p>
            <p className="text-white/50 text-sm leading-relaxed max-w-lg mx-auto">
              <b className="text-brand-emerald">Iḥsān</b> is to worship Allah as though you see Him —
              and though you do not see Him, He surely sees you
              <a href="https://sunnah.com/muslim:8a" target="_blank" rel="noopener noreferrer"
                className="text-brand-gold/60 underline ml-1 text-xs">(Ṣaḥīḥ Muslim 8a ↗)</a>.
              This app exists to help you bring that awareness into every day.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="rounded-2xl border border-brand-emerald/25 bg-brand-emerald/5 p-5 space-y-2">
            <p className="text-brand-emerald font-black text-sm uppercase tracking-widest">Our intention</p>
            <p className="text-white/60 text-sm leading-relaxed">
              Worship deserves better than noisy, gamified apps. Ihsan is calm by design: it counts
              what you ask it to count, reminds you gently, celebrates sincerely, and never turns
              your dīn into a game. It is free, has no ads, and never sells your data —
              built simply in the hope of being a ṣadaqah jāriyah.
            </p>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                className="rounded-2xl border border-emerald-500/10 bg-white/[0.04] p-4">
                <p className="text-2xl mb-1.5">{f.emoji}</p>
                <p className="text-white font-bold text-sm">{f.title}</p>
                <p className="text-white/40 text-xs leading-relaxed mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Authenticity */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl border border-brand-gold/25 bg-brand-gold/5 p-5 space-y-2">
            <p className="text-brand-gold font-black text-sm uppercase tracking-widest">📖 Authenticity first</p>
            <p className="text-white/60 text-sm leading-relaxed">
              Every verse and hadith in this app links to its exact source on{' '}
              <a href="https://quran.com" target="_blank" rel="noopener noreferrer" className="text-brand-emerald underline">quran.com</a> or{' '}
              <a href="https://sunnah.com" target="_blank" rel="noopener noreferrer" className="text-brand-emerald underline">sunnah.com</a>,
              with the grading shown where it matters. Nothing is quoted from memory — verify
              everything yourself, always. For personal rulings, please consult a qualified scholar.
            </p>
          </motion.div>

          {/* Privacy pointer */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="rounded-2xl border border-emerald-500/10 bg-white/[0.04] p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-bold text-sm">🔒 Your data stays yours</p>
              <p className="text-white/40 text-xs mt-0.5">Export or delete everything, feature by feature, anytime.</p>
            </div>
            <Link to="/privacy" className="btn btn-sm bg-brand-deep border border-brand-border text-white/70 hover:text-white shrink-0">
              Privacy →
            </Link>
          </motion.div>

          {/* Developer credit */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center pt-4 space-y-2">
            <p className="text-white/40 text-sm">
              Developed with ❤️ by <span className="text-brand-emerald font-bold">Istiak</span>
            </p>
            <a
              href="https://github.com/isttiiak/ihsan-web-app"
              target="_blank" rel="noopener noreferrer"
              aria-label="Ihsan on GitHub"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-emerald-500/10 text-white/60 hover:text-white hover:border-emerald-500/30 transition-all text-xs font-bold"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
              </svg>
              github.com/isttiiak/ihsan-web-app
            </a>
            <p className="text-white/20 text-[11px] italic pt-2">
              "The most beloved deeds to Allah are those most consistent, even if small." —{' '}
              <a href="https://sunnah.com/bukhari:6464" target="_blank" rel="noopener noreferrer" className="underline">Ṣaḥīḥ al-Bukhārī 6464 ↗</a>
            </p>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
