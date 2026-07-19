import React from 'react';
import type { StreakState } from '../types/api.js';

/**
 * Shared streak & goal capsules (Home card, Navbar, ZikrCounter).
 * Streak: 🔥 active · 🧊 grace (frozen — complete today to save it) ·
 *         red muted 🔥 with 0 when dead · ⏸️ paused.
 * Goal:   🎯 with % while in progress · 🏆 when completed.
 */

export function streakVisual(state: StreakState | undefined, streak: number): {
  icon: string;
  cls: string;
  tip: string;
  iconCls?: string;
} {
  if (state === 'paused') {
    return { icon: '⏸️', cls: 'bg-fuchsia-500/15 border-fuchsia-400/40', tip: 'Streak paused — resume from analytics' };
  }
  if (state === 'grace') {
    return {
      icon: '🧊',
      cls: 'bg-cyan-500/15 border-cyan-400/50',
      tip: `Streak frozen! Complete today's goal to keep your ${streak}-day streak alive`,
    };
  }
  if (streak <= 0 || state === 'none') {
    return {
      icon: '🔥',
      iconCls: 'grayscale opacity-70',
      cls: 'bg-red-500/15 border-red-400/50',
      tip: 'No streak yet — meet your daily goal to light the fire',
    };
  }
  return { icon: '🔥', cls: 'bg-brand-gold/20 border-brand-gold/40', tip: `${streak}-day streak — keep it burning!` };
}

export function StreakBadge({ streak, state, size = 'sm' }: {
  streak: number;
  state?: StreakState;
  size?: 'sm' | 'md';
}) {
  const v = streakVisual(state, streak);
  const dead = streak <= 0 || state === 'none';
  return (
    <div className="tooltip tooltip-bottom" data-tip={v.tip}>
      <span
        className={`rounded-full border font-bold flex items-center gap-1 text-white ${v.cls} ${
          size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <span className={v.iconCls} aria-hidden>{v.icon}</span>
        <span className={dead ? 'text-red-300' : state === 'grace' ? 'text-cyan-200' : ''}>{Math.max(0, streak)}</span>
      </span>
    </div>
  );
}

export function GoalBadge({ pct, met, size = 'sm' }: {
  pct: number | null;
  met: boolean;
  size?: 'sm' | 'md';
}) {
  if (pct === null) return null;
  return (
    <div className="tooltip tooltip-bottom" data-tip={met ? 'Daily goal achieved — māshā’Allāh! 🏆' : `${pct}% of today's goal`}>
      <span
        className={`rounded-full border font-bold flex items-center gap-1 text-white ${
          met ? 'bg-brand-emerald/25 border-brand-emerald/50' : 'bg-white/10 border-slate-400/20'
        } ${size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}
      >
        <span aria-hidden>{met ? '🏆' : '🎯'}</span>
        <span className={met ? 'text-brand-emerald' : ''}>{met ? '100%' : `${pct}%`}</span>
      </span>
    </div>
  );
}
