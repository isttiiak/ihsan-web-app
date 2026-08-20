import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import FeedbackForm, { type FormType } from '../components/FeedbackForm.js';

const TYPES: FormType[] = [
  {
    id: 'bug', label: 'Something is broken', emoji: '🐛',
    active: 'bg-red-500/15 border-red-400/40 text-red-100',
    hint: 'A bug, wrong number, or a screen that misbehaves',
  },
  {
    id: 'idea', label: 'I have an idea', emoji: '💡',
    active: 'bg-brand-gold/15 border-brand-gold/40 text-brand-gold',
    hint: 'A feature that would help your worship',
  },
  {
    id: 'design', label: 'Design & usability', emoji: '🎨',
    active: 'bg-brand-pink/15 border-brand-pink/40 text-brand-pink',
    hint: 'Hard to read, hard to reach, confusing flow',
  },
  {
    id: 'reference', label: 'A reference needs fixing', emoji: '📖',
    active: 'bg-brand-emerald/15 border-brand-emerald/40 text-brand-emerald',
    hint: 'A verse, hadith or grading you believe is inaccurate',
  },
  {
    id: 'question', label: 'A question', emoji: '❓',
    active: 'bg-brand-info/15 border-brand-info/40 text-brand-info',
    hint: 'How something works, or where to find it',
  },
  {
    id: 'account', label: 'Account help', emoji: '🔑',
    active: 'bg-brand-info/15 border-brand-info/40 text-brand-info',
    hint: 'Sign-in trouble, or data that looks wrong',
  },
  {
    id: 'privacy', label: 'Privacy & my data', emoji: '🔒',
    active: 'bg-brand-emerald/15 border-brand-emerald/40 text-brand-emerald',
    hint: 'Export, deletion, or a privacy question',
  },
  {
    id: 'collab', label: 'Collaborate', emoji: '🤝',
    active: 'bg-brand-gold/15 border-brand-gold/40 text-brand-gold',
    hint: 'Scholars, translators, designers, developers',
  },
  {
    id: 'appreciation', label: 'Just to say salam', emoji: '💚',
    active: 'bg-brand-info/15 border-brand-info/40 text-brand-info',
    hint: 'Encouragement, du\'a, or what you love',
  },
  {
    id: 'report', label: 'Report a concern', emoji: '⚠️',
    active: 'bg-red-500/15 border-red-400/40 text-red-100',
    hint: 'Misuse, security, or anything serious',
  },
  {
    id: 'other', label: 'Something else', emoji: '✨',
    active: 'bg-brand-info/15 border-brand-info/40 text-brand-info',
    hint: "Anything that doesn't fit above",
  },
];

const PROMISES = [
  { emoji: '📬', title: 'A real reply', text: 'Written by a human, usually within a few days.' },
  { emoji: '🔒', title: 'Kept private', text: 'Your message is only used to answer you.' },
  { emoji: '🕌', title: 'Built for the ummah', text: 'Free, ad-free, and always will be.' },
];

export default function Feedback() {
  return (
    <AnimatedBackground variant="dark">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">

        {/* hero */}
        <motion.div
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl border border-brand-emerald/25 bg-gradient-to-br from-brand-emerald/10 via-brand-info/10 to-brand-deep p-6 sm:p-8 overflow-hidden"
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

        {/* promises */}
        <div className="grid sm:grid-cols-3 gap-3">
          {PROMISES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}
              className="rounded-2xl border border-brand-emerald/10 bg-white/[0.03] p-4"
            >
              <div className="text-2xl">{p.emoji}</div>
              <p className="text-white/80 text-sm font-bold mt-1.5">{p.title}</p>
              <p className="text-white/40 text-xs mt-0.5 leading-snug">{p.text}</p>
            </motion.div>
          ))}
        </div>

        {/* form */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-brand-border bg-brand-surface p-5 sm:p-7"
        >
          <FeedbackForm kind="feedback" types={TYPES} submitLabel="Send message" />
        </motion.div>

        <p className="text-center text-white/25 text-[11px]">
          We only use what you send here to reply and improve Ihsan — never for anything else.
        </p>
      </div>
    </AnimatedBackground>
  );
}
