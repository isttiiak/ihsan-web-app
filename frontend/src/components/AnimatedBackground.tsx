import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

type BackgroundVariant = 'default' | 'dark' | 'premium' | 'ocean' | 'sunset' | 'vibrant';

interface VariantColors {
  bg: string;
  orb1: string;
  orb2: string;
  orb3: string;
}

interface AnimatedBackgroundProps {
  children: ReactNode;
  variant?: BackgroundVariant;
}

const VARIANTS: Record<BackgroundVariant, VariantColors> = {
  default: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/15 to-emerald-700/10',
    orb2: 'from-brand-gold/10 to-amber-600/[0.07]',
    orb3: 'from-brand-warm/[0.07] to-purple-800/5',
  },
  dark: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/20 to-cyan-700/15',
    orb2: 'from-brand-gold/15 to-amber-700/10',
    orb3: 'from-brand-warm/10 to-purple-800/[0.07]',
  },
  premium: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/15 to-emerald-700/10',
    orb2: 'from-brand-gold/10 to-amber-600/[0.07]',
    orb3: 'from-brand-warm/[0.07] to-purple-800/5',
  },
  ocean: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/15 to-teal-700/15',
    orb2: 'from-cyan-700/10 to-brand-emerald/[0.07]',
    orb3: 'from-blue-800/10 to-indigo-700/[0.07]',
  },
  sunset: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-orange-600/15 to-red-700/10',
    orb2: 'from-brand-gold/15 to-amber-600/10',
    orb3: 'from-brand-warm/10 to-pink-700/[0.07]',
  },
  vibrant: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/20 to-brand-emerald/10',
    orb2: 'from-brand-warm/15 to-brand-warm/[0.07]',
    orb3: 'from-brand-gold/10 to-brand-gold/[0.07]',
  },
};

export default function AnimatedBackground({ children, variant = 'default' }: AnimatedBackgroundProps) {
  const colors = VARIANTS[variant] ?? VARIANTS.default;

  return (
    // No overflow-hidden here — it breaks position:sticky on children.
    // Orbs are clipped inside their own overflow-hidden wrapper instead.
    <div className={`min-h-screen relative bg-gradient-to-br ${colors.bg}`}>
      {/* Orbs clipped to viewport — isolated overflow-hidden so sticky still works */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-0 w-96 h-96 rounded-full bg-gradient-to-r ${colors.orb1} blur-3xl`}
          animate={{ x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gradient-to-r ${colors.orb2} blur-3xl`}
          animate={{ x: [0, -40, 0], y: [0, -20, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 36, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-r ${colors.orb3} blur-3xl`}
          animate={{ scale: [1, 1.08, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
