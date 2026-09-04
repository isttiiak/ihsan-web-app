import { create } from 'zustand';

interface UiState {
  reduceMotion: boolean;
  highContrast: boolean;
  /** Show all-time Noor in the navbar on every page (default: friends page only) */
  showNoorAllTime: boolean;
  /** Show today's Noor in the navbar on every page (default: friends page only) */
  showNoorToday: boolean;
  /** Haptic pulse on each zikr count tap (mobile browsers only) */
  vibrationEnabled: boolean;
  /** Tasbih mode: auto-cycle SubhanAllah → Alhamdulillah → Allahu Akbar every 33 counts */
  tasbihMode: boolean;
  setReduceMotion: (val: boolean) => void;
  setHighContrast: (val: boolean) => void;
  setShowNoorAllTime: (val: boolean) => void;
  setShowNoorToday: (val: boolean) => void;
  setVibrationEnabled: (val: boolean) => void;
  setTasbihMode: (val: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  reduceMotion: localStorage.getItem('ihsan_reduce_motion') === '1',
  highContrast: localStorage.getItem('ihsan_high_contrast') === '1',
  showNoorAllTime: localStorage.getItem('ihsan_noor_alltime') === '1',
  showNoorToday: localStorage.getItem('ihsan_noor_today') === '1',
  vibrationEnabled: localStorage.getItem('ihsan_vibration') !== '0',
  tasbihMode: localStorage.getItem('ihsan_tasbih_mode') === '1',

  setReduceMotion: (val) => {
    localStorage.setItem('ihsan_reduce_motion', val ? '1' : '0');
    set({ reduceMotion: !!val });
  },

  setHighContrast: (val) => {
    localStorage.setItem('ihsan_high_contrast', val ? '1' : '0');
    set({ highContrast: !!val });
  },

  setShowNoorAllTime: (val) => {
    localStorage.setItem('ihsan_noor_alltime', val ? '1' : '0');
    set({ showNoorAllTime: !!val });
  },

  setShowNoorToday: (val) => {
    localStorage.setItem('ihsan_noor_today', val ? '1' : '0');
    set({ showNoorToday: !!val });
  },

  setVibrationEnabled: (val) => {
    localStorage.setItem('ihsan_vibration', val ? '1' : '0');
    set({ vibrationEnabled: !!val });
  },

  setTasbihMode: (val) => {
    localStorage.setItem('ihsan_tasbih_mode', val ? '1' : '0');
    set({ tasbihMode: !!val });
  },
}));
