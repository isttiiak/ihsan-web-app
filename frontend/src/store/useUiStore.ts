import { create } from 'zustand';

interface UiState {
  reduceMotion: boolean;
  highContrast: boolean;
  setReduceMotion: (val: boolean) => void;
  setHighContrast: (val: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  reduceMotion: localStorage.getItem('ihsan_reduce_motion') === '1',
  highContrast: localStorage.getItem('ihsan_high_contrast') === '1',

  setReduceMotion: (val) => {
    localStorage.setItem('ihsan_reduce_motion', val ? '1' : '0');
    set({ reduceMotion: !!val });
  },

  setHighContrast: (val) => {
    localStorage.setItem('ihsan_high_contrast', val ? '1' : '0');
    set({ highContrast: !!val });
  },
}));
