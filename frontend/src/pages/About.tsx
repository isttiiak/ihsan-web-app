import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateReference } from '../utils/localeReference.js';
import AnimatedBackground from '../components/AnimatedBackground.js';
import Seo from '../components/Seo.js';

const FEATURE_KEYS = [
  { emoji: '📿', key: 'zikrCounter' },
  { emoji: '🕌', key: 'salatTracker' },
  { emoji: '🕐', key: 'prayerTimes' },
  { emoji: '🌙', key: 'fastingTracker' },
  { emoji: '📖', key: 'quranHabit' },
  { emoji: '🤝', key: 'friends' },
];

export default function About() {
  const { t, i18n } = useTranslation();

  const features = FEATURE_KEYS.map((f) => ({
    emoji: f.emoji,
    title: t(`about.feature.${f.key}.title`),
    desc: t(`about.feature.${f.key}.desc`),
  }));

  return (
    <AnimatedBackground variant="dark">
      <Seo
        title="About Ihsan — Our Mission"
        description="Ihsan is a free, private Islamic productivity app for zikr, salat, fasting and Quran habits — built for the Muslim community with authentic Quran and hadith references."
        path="/about"
      />
      <h1 className="sr-only">{t('about.srTitle')}</h1>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-5 pb-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6 space-y-3"
          >
            <p className="text-5xl">🕌</p>
            <h2 className="text-3xl font-black text-white">{t('about.heading')}</h2>
            <p className="font-arabic text-brand-gold/70 text-xl">الإحسان</p>
            <p className="text-white/50 text-sm leading-relaxed max-w-lg mx-auto">
              <b className="text-brand-emerald">Iḥsān</b> {t('about.ihsanDefinition')}
              <a
                href="https://sunnah.com/muslim:8a"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gold/60 underline ml-1 text-xs"
              >
                {translateReference('(Ṣaḥīḥ Muslim 8a ↗)', i18n.language)}
              </a>
              . {t('about.ihsanPurpose')}
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl border border-brand-emerald/25 bg-brand-emerald/5 p-5 space-y-2"
          >
            <p className="text-brand-emerald font-black text-sm uppercase tracking-widest">
              {t('about.intentionLabel')}
            </p>
            <p className="text-white/60 text-sm leading-relaxed">{t('about.intentionText')}</p>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                className="rounded-2xl border border-brand-emerald/10 bg-white/[0.04] p-4"
              >
                <p className="text-2xl mb-1.5">{f.emoji}</p>
                <p className="text-white font-bold text-sm">{f.title}</p>
                <p className="text-white/40 text-xs leading-relaxed mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Authenticity */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-brand-gold/25 bg-brand-gold/5 p-5 space-y-2"
          >
            <p className="text-brand-gold font-black text-sm uppercase tracking-widest">
              📖 {t('about.authenticityLabel')}
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              {t('about.authenticityText1')}{' '}
              <a
                href="https://quran.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-emerald underline"
              >
                quran.com
              </a>{' '}
              {t('about.authenticityOr')}{' '}
              <a
                href="https://sunnah.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-emerald underline"
              >
                sunnah.com
              </a>
              , {t('about.authenticityText2')}
            </p>
          </motion.div>

          {/* Privacy pointer */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border border-brand-emerald/10 bg-white/[0.04] p-5 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-white font-bold text-sm">🔒 {t('about.dataTitle')}</p>
              <p className="text-white/40 text-xs mt-0.5">{t('about.dataDesc')}</p>
            </div>
            <Link
              to="/privacy"
              className="btn btn-sm bg-brand-deep border border-brand-border text-white/70 hover:text-white shrink-0"
            >
              {t('about.privacyLink')}
            </Link>
          </motion.div>

          {/* Developer credit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4 space-y-2"
          >
            <p className="text-white/40 text-sm">
              {t('about.developedBy')} <span className="text-brand-emerald font-bold">Istiak</span>
            </p>
            <a
              href="https://github.com/isttiiak/ihsan-web-app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('about.githubAriaLabel')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-brand-emerald/10 text-white/60 hover:text-white hover:border-brand-emerald/30 transition-all text-xs font-bold"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              github.com/isttiiak/ihsan-web-app
            </a>
            <p className="text-white/20 text-[11px] italic pt-2">
              {t('about.hadithQuote')} —{' '}
              <a
                href="https://sunnah.com/bukhari:6464"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {translateReference('Ṣaḥīḥ al-Bukhārī 6464 ↗', i18n.language)}
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
