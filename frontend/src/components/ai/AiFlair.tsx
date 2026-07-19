import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * The distinct "AI feel" — deliberately more colorful and alive than the calm
 * emerald app chrome, so an AI surface reads as generative at a glance:
 * a slowly rotating aurora gradient, prismatic dots, and a shimmering label.
 * Every AI output carries <AiDisclaimer/> — never a source of evidence.
 */

const AI_GRADIENT =
  'conic-gradient(from 0deg, #10b981, #06b6d4, #6366f1, #a855f7, #ec4899, #f59e0b, #10b981)';

/** A colorful pill/badge that marks a surface as AI. */
export function AiBadge({ label = 'Naseeh · AI companion' }: { label?: string }) {
  return (
    <span className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black text-white overflow-hidden">
      <motion.span
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4,#a855f7,#ec4899,#f59e0b,#10b981)', backgroundSize: '300% 100%' }}
        animate={{ backgroundPosition: ['0% 50%', '300% 50%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      <span className="relative">✨</span>
      <span className="relative">{label}</span>
    </span>
  );
}

/** Prismatic "thinking" loader — colorful pulsing dots over a soft aurora. */
export function AiThinking({ label = 'Naseeh is reflecting…' }: { label?: string }) {
  const colors = ['#10b981', '#06b6d4', '#a855f7', '#ec4899', '#f59e0b'];
  return (
    <div className="relative flex flex-col items-center justify-center gap-3 py-6">
      <motion.div
        aria-hidden
        className="absolute w-32 h-32 rounded-full blur-2xl opacity-40"
        style={{ background: 'radial-gradient(circle, #a855f7, #06b6d4, transparent 70%)' }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative flex items-center gap-2">
        {colors.map((c, i) => (
          <motion.span
            key={c}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: c, boxShadow: `0 0 10px ${c}` }}
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="relative text-white/50 text-xs font-semibold tracking-wide">{label}</p>
    </div>
  );
}

/** A card wrapped in a slowly rotating colorful AI gradient border. */
export function AiPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-3xl p-[1.5px] overflow-hidden ${className}`}>
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2"
        style={{ background: AI_GRADIENT }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative rounded-[calc(1.5rem-1.5px)] bg-brand-deep/95 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

/** The non-negotiable label under every AI output. */
export function AiDisclaimer() {
  return (
    <p className="text-white/35 text-[10px] leading-relaxed mt-2 flex items-start gap-1">
      <span aria-hidden>✨</span>
      <span>
        AI-generated encouragement — a companion, <b className="text-white/50">never a source of religious evidence</b>.
        For rulings or proofs, see the app's verified references or ask a qualified scholar.
      </span>
    </p>
  );
}
