import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

export default function DemoBanner() {
  const { isDemoMode, exitDemoMode } = useAuthStore();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  return (
    <div className="sticky top-0 z-[90] flex items-center justify-center gap-3 px-4 py-2 bg-brand-gold/15 border-b border-brand-gold/20 text-sm backdrop-blur-sm">
      <span className="text-brand-gold font-semibold">Demo mode</span>
      <span className="text-white/50 hidden sm:inline">— changes won't be saved</span>
      <button
        className="ml-2 px-3 py-0.5 rounded-full bg-brand-emerald/20 text-brand-emerald text-xs font-bold hover:bg-brand-emerald/30 transition-colors"
        onClick={() => { exitDemoMode(); navigate('/signup'); }}
      >
        Sign up to save
      </button>
    </div>
  );
}
