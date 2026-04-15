import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function QuranHabit() {
  const navigate = useNavigate();

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-8">

          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-surface/90 backdrop-blur-md border border-brand-border text-white text-sm font-semibold"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 py-16"
          >
            <div className="text-7xl mb-6">📖</div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Quran Habit</h1>
            <p className="text-white/50 text-base max-w-sm mx-auto">
              Track your daily Quran reading, set recitation goals, and build a consistent habit.
            </p>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg border border-white/10"
              style={{ background: 'linear-gradient(90deg, var(--brand-gold) 0%, var(--brand-magenta) 100%)' }}>
              Coming Soon…
            </div>

            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { icon: '📅', title: 'Daily Pages', desc: 'Set a daily page or juz goal and track completion' },
                { icon: '🔥', title: 'Reading Streak', desc: 'Build a consecutive-day reading streak' },
                { icon: '📊', title: 'Progress Charts', desc: 'Visualise how much you\'ve read over weeks and months' },
              ].map((f) => (
                <div key={f.title} className="card bg-brand-surface/60 border border-brand-border rounded-2xl">
                  <div className="card-body p-4">
                    <span className="text-2xl">{f.icon}</span>
                    <h3 className="text-white font-bold text-sm mt-2">{f.title}</h3>
                    <p className="text-white/40 text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </AnimatedBackground>
  );
}
