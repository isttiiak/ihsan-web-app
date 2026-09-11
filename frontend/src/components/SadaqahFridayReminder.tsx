import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isFriday } from '../utils/islamicCalendar.js';
import { getTrackingDay } from '../utils/trackingDay.js';

const STORAGE_KEY = 'bustandeen_sadaqah_friday_shown';
const VISIBLE_MS = 30_000;

/**
 * A gentle, once-a-day Friday nudge toward /sadaqah — never a permanent
 * fixture. Shows once per Jumu'ah (tracked by day, not session, so
 * navigating around the app doesn't re-trigger it) and disappears on its
 * own after 30s even if nobody touches it, matching the explicit "don't
 * force this on anyone" direction it was built under.
 */
export default function SadaqahFridayReminder() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isFriday()) return;
    const today = getTrackingDay();
    try {
      if (localStorage.getItem(STORAGE_KEY) === today) return;
      localStorage.setItem(STORAGE_KEY, today);
    } catch {
      /* if storage is unavailable, just show it once for this page load */
    }

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 overflow-hidden"
        >
          <div className="relative rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-brand-emerald/5 p-4">
            <button
              onClick={() => setVisible(false)}
              aria-label={t('common.dismiss', 'Dismiss')}
              className="absolute top-3 right-3 text-white/30 hover:text-white text-xs"
            >
              ✕
            </button>
            <Link
              to="/sadaqah"
              onClick={() => setVisible(false)}
              className="flex items-start gap-3 pr-6"
            >
              <span className="text-2xl shrink-0">🤲</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-brand-gold font-black text-sm">
                  {t('home.fridaySadaqahTitle', "It's Jumu'ah — a blessed day to give")}
                </h3>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">
                  {t(
                    'home.fridaySadaqahDesc',
                    'Sadaqah given on Friday is especially recommended. If you can, consider giving today.'
                  )}
                </p>
              </div>
              <span className="text-brand-gold/60 text-lg shrink-0">→</span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
