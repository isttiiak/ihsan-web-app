import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground.js';
import FeedbackForm, { type FormType } from '../components/FeedbackForm.js';

/**
 * /contact — a direct line for questions, privacy requests and collaboration.
 */

const TYPES: FormType[] = [
  {
    id: 'question', label: 'A question', emoji: '❓',
    active: 'bg-cyan-500/15 border-cyan-400/45 text-cyan-100',
    hint: 'How something works, or where to find it',
  },
  {
    id: 'account', label: 'Account help', emoji: '🔑',
    active: 'bg-indigo-500/15 border-indigo-400/45 text-indigo-100',
    hint: 'Sign-in trouble, or data that looks wrong',
  },
  {
    id: 'privacy', label: 'Privacy & my data', emoji: '🔒',
    active: 'bg-brand-emerald/15 border-brand-emerald/45 text-emerald-100',
    hint: 'Export, deletion, or a privacy question',
  },
  {
    id: 'collab', label: 'Collaborate', emoji: '🤝',
    active: 'bg-brand-gold/15 border-brand-gold/45 text-amber-100',
    hint: 'Scholars, translators, designers, developers',
  },
  {
    id: 'report', label: 'Report a concern', emoji: '⚠️',
    active: 'bg-red-500/15 border-red-400/45 text-red-100',
    hint: 'Misuse, security, or anything serious',
  },
  {
    id: 'other', label: 'Something else', emoji: '✨',
    active: 'bg-fuchsia-500/15 border-fuchsia-400/45 text-fuchsia-100',
    hint: "Anything that doesn't fit above",
  },
];

const PROMISES = [
  { emoji: '📬', title: 'A real reply', text: 'Written by a human, usually within a few days.' },
  { emoji: '🔒', title: 'Kept private', text: 'Your message is only used to answer you.' },
  { emoji: '🕌', title: 'Built for the ummah', text: 'Free, ad-free, and always will be.' },
];

export default function Contact() {
  return (
    <AnimatedBackground variant="dark">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">

        {/* hero */}
        <motion.div
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/12 via-indigo-500/8 to-brand-deep p-6 sm:p-8 overflow-hidden"
        >
          <motion.div
            aria-hidden
            className="absolute -bottom-16 -left-12 w-52 h-52 rounded-full bg-cyan-500/15 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative">
            <motion.div
              className="text-5xl mb-3 inline-block"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            >📨</motion.div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Contact us</h1>
            <p className="text-white/55 text-sm sm:text-base mt-2.5 leading-relaxed">
              Questions, privacy requests, or a wish to help build Ihsan — this reaches us directly.
              As-salāmu ʿalaykum, and thank you for taking the time.
            </p>
          </div>
        </motion.div>

        {/* promises */}
        <div className="grid sm:grid-cols-3 gap-3">
          {PROMISES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}
              className="rounded-2xl border border-slate-400/12 bg-white/[0.03] p-4"
            >
              <div className="text-2xl">{p.emoji}</div>
              <p className="text-white/85 text-sm font-bold mt-1.5">{p.title}</p>
              <p className="text-white/40 text-xs mt-0.5 leading-snug">{p.text}</p>
            </motion.div>
          ))}
        </div>

        {/* form */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-3xl border border-brand-border bg-brand-surface p-5 sm:p-7"
        >
          <FeedbackForm kind="contact" types={TYPES} submitLabel="Send message" />
        </motion.div>

        <p className="text-center text-white/30 text-xs">
          Have a bug or an idea instead? <Link to="/feedback" className="underline text-white/50 hover:text-white">Share feedback →</Link>
        </p>
      </div>
    </AnimatedBackground>
  );
}
