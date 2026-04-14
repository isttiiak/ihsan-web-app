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
    orb1: 'from-brand-emerald/20 to-emerald-700/20',
    orb2: 'from-brand-gold/15 to-amber-600/15',
    orb3: 'from-brand-magenta/10 to-purple-800/10',
  },
  dark: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/30 to-cyan-700/30',
    orb2: 'from-brand-gold/20 to-amber-700/20',
    orb3: 'from-brand-magenta/15 to-purple-800/10',
  },
  premium: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/20 to-emerald-700/20',
    orb2: 'from-brand-gold/15 to-amber-600/15',
    orb3: 'from-brand-magenta/10 to-purple-800/10',
  },
  ocean: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/25 to-teal-700/25',
    orb2: 'from-cyan-700/20 to-brand-emerald/15',
    orb3: 'from-blue-800/15 to-indigo-700/10',
  },
  sunset: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-orange-600/20 to-red-700/20',
    orb2: 'from-brand-gold/20 to-amber-600/15',
    orb3: 'from-brand-magenta/15 to-pink-700/10',
  },
  vibrant: {
    bg: 'from-brand-void to-brand-void via-brand-deep',
    orb1: 'from-brand-emerald/30 to-brand-emerald/20',
    orb2: 'from-brand-magenta/25 to-brand-magenta/15',
    orb3: 'from-brand-gold/20 to-brand-gold/15',
  },
};

export default function AnimatedBackground({ children, variant = 'default' }: AnimatedBackgroundProps) {
  const colors = VARIANTS[variant] ?? VARIANTS.default;

  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${colors.bg}`}>
      {/* Animated Gradient Orbs */}
      <motion.div
        className={`absolute top-0 left-0 w-96 h-96 rounded-full bg-gradient-to-r ${colors.orb1} blur-3xl`}
        animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gradient-to-r ${colors.orb2} blur-3xl`}
        animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-r ${colors.orb3} blur-3xl`}
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
