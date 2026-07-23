import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground.js';
import FeedbackForm, { type FormType } from '../components/FeedbackForm.js';

/**
 * /feedback — an honest, warm invitation to shape the app. Ihsan is built by
 * one person for the ummah, so a single message really does change the roadmap.
 */

const TYPES: FormType[] = [
  {
    id: 'bug', label: 'Something is broken', emoji: '🐛',
    active: 'bg-red-500/15 border-red-400/40 text-red-100',
    hint: 'A bug, wrong number, or a screen that misbehaves',
  },
  {
    id: 'idea', label: 'I have an idea', emoji: '💡',
    active: 'bg-brand-gold/15 border-brand-gold/40 text-amber-100',
    hint: 'A feature that would help your worship',
  },
  {
    id: 'design', label: 'Design & usability', emoji: '🎨',
    active: 'bg-fuchsia-500/15 border-fuchsia-400/40 text-fuchsia-100',
    hint: 'Hard to read, hard to reach, confusing flow',
  },
  {
    id: 'reference', label: 'A reference needs fixing', emoji: '📖',
    active: 'bg-brand-emerald/15 border-brand-emerald/40 text-emerald-100',
    hint: 'A verse, hadith or grading you believe is inaccurate',
  },
  {
    id: 'appreciation', label: 'Just to say salām', emoji: '💚',
    active: 'bg-teal-500/15 border-teal-400/40 text-teal-100',
    hint: 'Encouragement, du\'ā, or what you love',
  },
  {
    id: 'other', label: 'Something else', emoji: '✨',
    active: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-100',
    hint: "Anything that doesn't fit above",
  },
];

export default function Feedback() {
  return (
    <AnimatedBackground variant="dark">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">

        {/* hero */}
        <motion.div
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl border border-brand-emerald/25 bg-gradient-to-br from-brand-emerald/10 via-teal-500/10 to-brand-deep p-6 sm:p-8 overflow-hidden"
        >
          <motion.div
            aria-hidden
            className="absolute -top-16 -right-12 w-52 h-52 rounded-full bg-brand-emerald/15 blur-3xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative">
            <motion.div
              className="text-5xl mb-3 origin-bottom inline-block"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            >💬</motion.div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Your voice shapes Ihsan</h1>
            <p className="text-white/50 text-sm sm:text-base mt-2.5 leading-relaxed">
              Ihsan is built quietly by one developer for the sake of Allah — which means there's no big team
              testing every screen. <b className="text-white/80">You are the testers.</b> If something broke,
              felt confusing, or you wished a feature existed — tell us. It genuinely gets read, and it
              genuinely changes what gets built next.
            </p>
            <p className="text-brand-emerald/75 text-xs mt-3 leading-relaxed">
              📖 Found a verse, hadith or grading you believe is inaccurate? Please report it — authenticity is
              the one thing we will never compromise, and corrections are treated as urgent.
            </p>
          </div>
        </motion.div>

        {/* form */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-brand-border bg-brand-surface p-5 sm:p-7"
        >
          <FeedbackForm kind="feedback" types={TYPES} submitLabel="Send feedback" />
        </motion.div>

        <p className="text-center text-white/30 text-xs">
          Need to reach us about something else? <Link to="/contact" className="underline text-white/50 hover:text-white">Contact us →</Link>
        </p>
      </div>
    </AnimatedBackground>
  );
}
