import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { useAuthStore } from '../store/useAuthStore.js';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const FEATURES = [
  {
    emoji: '🕌', title: 'Salat Tracker',
    text: 'All five prayers with on-time, late and missed states — plus sunnah and nafl. Mark the tasbīḥ after a prayer and it logs to your zikr count on its own; Āyatul Kursī and the post-salat surahs are one tap away.',
    grad: 'from-brand-info/20 to-brand-warm/10', border: 'border-brand-info/25',
    to: '/salat',
  },
  {
    emoji: '📿', title: 'Zikr Counter',
    text: 'A beautiful tap counter with goals, fair streaks that give you a grace day, and a verified library of ṣalawāt, istighfār and the weighty words — with Arabic, transliteration and the exact reference for each.',
    grad: 'from-brand-emerald/20 to-brand-info/10', border: 'border-brand-emerald/25',
    to: '/zikr',
  },
  {
    emoji: '📖', title: 'Quran — read & listen',
    text: 'An āyah-by-āyah reader with recitation, word highlighting, Bengali & English translations, a khatam journey, seven reciters, and one unified streak.',
    grad: 'from-brand-info/20 to-brand-info/10', border: 'border-brand-info/25',
    to: '/quran',
  },
  {
    emoji: '🌙', title: 'Fasting + Ramadan',
    text: 'Qaḍā, kaffārah, vows and every sunnah day — each rule cited to its exact hadith. And a dedicated Ramadan home with suhoor, iftar, tarawih and Laylat al-Qadr.',
    grad: 'from-brand-gold/20 to-brand-warm/10', border: 'border-brand-gold/25',
    to: '/fasting',
  },
  {
    emoji: '🕐', title: 'Prayer Times',
    text: 'Computed fully on your device — your location never leaves your browser. Live countdowns, forbidden windows, nafl windows.',
    grad: 'from-brand-info/20 to-brand-info/10', border: 'border-brand-info/25',
    to: '/prayer-times',
  },
  {
    emoji: '🤝', title: 'Friends & Noor',
    text: '"So compete with one another in doing good" (Quran 2:148). Connect with one link and race each other gently with Noor — a calm daily light out of 100.',
    grad: 'from-brand-pink/20 to-brand-warm/10', border: 'border-brand-pink/25',
    to: '/friends',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { enterDemoMode } = useAuthStore();
  const [showPicker, setShowPicker] = useState(false);

  const pickGender = (gender: string) => {
    enterDemoMode(gender);
    navigate('/');
  };

  return (
    <AnimatedBackground variant="dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── Hero ── */}
        <section className="text-center pt-14 sm:pt-20 pb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            className="text-7xl mb-5"
          >🌙</motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-6xl font-black text-white leading-tight"
          >
            Worship, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-brand-info">beautifully kept</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto mt-5 leading-relaxed"
          >
            Iḥsān is to worship Allah as though you see Him. This is your companion for that path —
            salat, zikr, Quran, fasting, and the gentle numbers that keep you going. Free, ad-free,
            and honest with every reference.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            <button
              className="btn h-13 px-8 rounded-2xl border-0 text-white text-base font-black bg-gradient-to-r from-brand-emerald to-brand-info hover:from-brand-emerald hover:to-brand-info shadow-xl shadow-brand-emerald-dim/40"
              onClick={() => navigate('/signup')}
            >Begin your journey — free</button>
            <button
              className="btn h-13 px-6 rounded-2xl bg-white/5 border-brand-emerald/15 text-white/80 font-bold"
              onClick={() => setShowPicker(true)}
            >Explore the full app</button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-white/25 text-xs mt-4"
          >No ads · no subscriptions · your data stays yours</motion.p>
        </section>

        {/* ── Rayhanah highlight — the first ── */}
        <motion.section {...fadeUp} className="mb-10">
          <div className="rounded-3xl p-6 sm:p-10 border border-brand-pink/25 bg-gradient-to-br from-brand-pink/15 via-brand-pink/10 to-brand-warm/10 relative overflow-hidden">
            <motion.div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-pink/15 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative sm:flex items-center gap-8">
              <div className="text-6xl sm:text-7xl text-center sm:text-left mb-4 sm:mb-0">🌸</div>
              <div>
                <p className="text-brand-pink/80 text-xs font-black uppercase tracking-widest">A first among Muslim productivity apps</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">Rayhanah Cycle — for our sisters</h2>
                <p className="text-brand-pink/70 text-sm sm:text-base mt-3 leading-relaxed max-w-2xl">
                  Allah Himself excused women from salat and fasting during their days — so Ihsan does too,
                  with zero guilt. Cycle tracking with predictions and wellness notes, a ghusl guide,
                  Ramadan days flowing into the make-up counter automatically, and a Noor score that keeps
                  shining from dhikr, Quran and ṣalawāt. Completely private:
                  <span className="font-bold text-brand-pink"> no friend can ever tell.</span>
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Feature grid ── */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.45 }}
            >
              <Link
                to={f.to}
                className={`block rounded-3xl border ${f.border} bg-gradient-to-br ${f.grad} p-6 h-full transition-transform hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="text-white font-black text-lg">{f.title}</h3>
                <p className="text-white/50 text-sm mt-2 leading-relaxed">{f.text}</p>
                <span className="inline-block mt-3 text-xs font-semibold text-brand-emerald/70">Try it →</span>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* ── Authenticity strip ── */}
        <motion.section {...fadeUp} className="mb-12">
          <div className="rounded-3xl border border-brand-gold/25 bg-gradient-to-r from-brand-gold/10 to-transparent p-6 sm:p-8 sm:flex items-center gap-6">
            <div className="text-5xl text-center sm:text-left mb-3 sm:mb-0">🔍</div>
            <div>
              <h3 className="text-white font-black text-lg">Every reference, verified</h3>
              <p className="text-white/50 text-sm mt-1.5 leading-relaxed max-w-2xl">
                Each Quran verse and hadith in Ihsan links to quran.com or sunnah.com with its exact
                number, and grades are shown where they matter. No fabricated virtues, no folklore —
                if we can't verify it, we don't say it.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── The day begins at Fajr ── */}
        <motion.section {...fadeUp} className="mb-12">
          <div className="rounded-3xl border border-brand-emerald/10 bg-brand-deep/70 p-6 sm:p-8 text-center">
            <div className="text-4xl mb-2">🌅</div>
            <h3 className="text-white font-black text-lg">Your day begins at Fajr — not midnight</h3>
            <p className="text-white/40 text-sm mt-2 max-w-xl mx-auto leading-relaxed">
              Isha prayed after midnight and suhoor before dawn belong to the right day, because Ihsan's
              tracking day flows the way a worship day actually does: dawn to dawn.
            </p>
          </div>
        </motion.section>

        {/* ── Final CTA ── */}
        <motion.section {...fadeUp} className="text-center pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            "So compete with one another in doing good."
          </h2>
          <p className="text-white/30 text-sm mt-2">
            <a className="underline" href="https://quran.com/2/148" target="_blank" rel="noreferrer">Quran 2:148</a>
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <button
              className="btn h-13 px-10 rounded-2xl border-0 text-white text-base font-black bg-gradient-to-r from-brand-emerald to-brand-info hover:from-brand-emerald hover:to-brand-info shadow-xl shadow-brand-emerald-dim/40"
              onClick={() => navigate('/signup')}
            >Create your free account</button>
            <Link to="/about" className="btn h-13 px-6 rounded-2xl bg-white/5 border-brand-emerald/15 text-white/70 font-bold">
              Read our story
            </Link>
          </div>
        </motion.section>
      </div>

      {/* Gender picker overlay */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.25 }}
              className="bg-brand-deep border border-brand-border rounded-3xl p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl mb-3">🌙</div>
              <h3 className="text-white font-black text-xl">How would you like to explore?</h3>
              <p className="text-white/40 text-sm mt-2 mb-6">Choose a demo profile — you can explore all features freely.</p>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-4 rounded-2xl border border-brand-info/25 bg-brand-info/10 hover:bg-brand-info/20 transition-colors"
                  onClick={() => pickGender('male')}
                >
                  <div className="text-3xl mb-1">🕌</div>
                  <div className="text-white font-bold text-sm">Brother</div>
                </button>
                <button
                  className="flex-1 py-4 rounded-2xl border border-brand-pink/25 bg-brand-pink/10 hover:bg-brand-pink/20 transition-colors"
                  onClick={() => pickGender('female')}
                >
                  <div className="text-3xl mb-1">🌸</div>
                  <div className="text-white font-bold text-sm">Sister</div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedBackground>
  );
}
