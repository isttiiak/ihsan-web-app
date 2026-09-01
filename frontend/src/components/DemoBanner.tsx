import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore.js';

export default function DemoBanner() {
  const { t } = useTranslation();
  const { isDemoMode, exitDemoMode } = useAuthStore();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  return (
    <div className="sticky top-0 z-[90] flex items-center justify-center gap-3 px-4 py-2 bg-brand-gold/15 border-b border-brand-gold/20 text-sm backdrop-blur-sm">
      <span className="text-brand-gold font-semibold">{t('demoBanner.demoMode')}</span>
      <span className="text-white/50 hidden sm:inline">{t('demoBanner.changesNotSaved')}</span>
      <button
        className="ml-2 px-3 py-0.5 rounded-full bg-brand-emerald/20 text-brand-emerald text-xs font-bold hover:bg-brand-emerald/30 transition-colors"
        onClick={() => { exitDemoMode(); navigate('/signup'); }}
      >
        {t('demoBanner.signUpToSave')}
      </button>
    </div>
  );
}
