import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Shown in place of salat/fasting logging while a Rayhanah cycle is active.
 * Tone: sweet, powerful, zero guilt (Istiak's spec — flower emojis, motivating).
 */
const CARD_PHRASES = [
  '🌸 These days are a mercy, not a gap — your reward flows on.',
  '🌷 The pen is lifted from this duty, but never from your good deeds.',
  '🌺 Rest here is obedience. Your Lord wrote it for you with love.',
];

export default function ExcusedCard({ feature }: { feature: 'salat' | 'fasting' }) {
  const phrase = CARD_PHRASES[Math.floor(Date.now() / 86_400_000) % CARD_PHRASES.length]!;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 sm:p-8 border border-pink-400/25 bg-gradient-to-br from-pink-500/15 via-rose-500/10 to-purple-500/10 relative overflow-hidden text-center"
    >
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-pink-500/15 blur-2xl" />
      <div className="relative space-y-3">
        <div className="text-5xl">🌸</div>
        <h2 className="text-xl font-black text-white">Rayhanah days — you are excused</h2>
        <p className="text-pink-100/80 text-sm leading-relaxed max-w-md mx-auto">{phrase}</p>
        <p className="text-white/40 text-xs leading-relaxed max-w-md mx-auto">
          {feature === 'salat' ? (
            <>Ṣalāt is fully lifted from you during these days and is <span className="font-bold text-pink-200/90">never made up</span> —{' '}
            <a className="underline" href="https://sunnah.com/muslim:335" target="_blank" rel="noreferrer">Ṣaḥīḥ Muslim 335</a>.</>
          ) : (
            <>Fasting pauses now and is made up later — your qaḍā counter keeps track for you —{' '}
            <a className="underline" href="https://sunnah.com/muslim:335" target="_blank" rel="noreferrer">Ṣaḥīḥ Muslim 335</a>.</>
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Link to="/cycle" className="btn btn-sm rounded-xl border border-pink-400/30 bg-pink-500/15 hover:bg-pink-500/25 text-pink-100 font-bold">
            🪻 Open your Garden of Light
          </Link>
          <Link to="/zikr" className="btn btn-sm rounded-xl border border-emerald-500/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold">
            📿 Do dhikr instead
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
