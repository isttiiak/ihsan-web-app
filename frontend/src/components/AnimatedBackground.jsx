import React from "react";
import { motion } from "framer-motion";

/**
 * Reusable animated background component with gradient orbs and floating particles
 * Provides a modern, React Bits-inspired aesthetic
 */
export default function AnimatedBackground({ children, variant = "default" }) {
  // Different color variants for different sections
  const variants = {
    default: {
      bg: "from-slate-900 via-purple-900 to-slate-900",
      orb1: "from-teal-400/30 to-blue-500/30",
      orb2: "from-purple-500/30 to-pink-500/30",
      orb3: "from-emerald-500/20 to-teal-500/20",
    },
    dark: {
      bg: "from-slate-800 via-indigo-900 to-slate-800",
      orb1: "from-teal-400/50 to-cyan-500/60",
      orb2: "from-purple-400/50 to-indigo-500/60",
      orb3: "from-blue-400/40 to-sky-500/50",
    },
    premium: {
      bg: "from-brand-deep to-brand-deep via-slate-900",
      orb1: "from-brand-emerald/70 to-emerald-400/80",
      orb2: "from-brand-magenta/70 to-pink-500/80",
      orb3: "from-brand-gold/60 to-amber-300/70",
    },
    ocean: {
      bg: "from-slate-900 via-blue-900 to-slate-900",
      orb1: "from-blue-400/30 to-cyan-500/30",
      orb2: "from-teal-500/30 to-emerald-500/30",
      orb3: "from-indigo-500/20 to-blue-500/20",
    },
    sunset: {
      bg: "from-slate-900 via-orange-900 to-slate-900",
      orb1: "from-orange-400/30 to-red-500/30",
      orb2: "from-pink-500/30 to-purple-500/30",
      orb3: "from-yellow-500/20 to-orange-500/20",
    },
    vibrant: {
      bg: "from-slate-800 via-slate-700 to-slate-800",
      orb1: "from-brand-emerald/60 to-brand-emerald/70",
      orb2: "from-brand-magenta/60 to-brand-magenta/70",
      orb3: "from-brand-gold/50 to-brand-gold/60",
    },
  };

  const colors = variants[variant] || variants.default;

  return (
    <div
      className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${colors.bg}`}
    >
      {/* Animated Gradient Orbs */}
      <motion.div
        className={`absolute top-0 left-0 w-96 h-96 rounded-full bg-gradient-to-r ${colors.orb1} blur-3xl`}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={`absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gradient-to-r ${colors.orb2} blur-3xl`}
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-r ${colors.orb3} blur-3xl`}
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Grid Pattern Overlay (optional subtle effect) */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
