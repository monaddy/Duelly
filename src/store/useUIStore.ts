import { create } from 'zustand';
import { Howl } from 'howler';
import { base64Dice } from '../assets/soundsBase64';

type HapticType = 'impact' | 'success' | 'warning' | 'error';

type UIState = {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;

  soundOn: boolean;
  setSoundOn: (v: boolean) => void;

  diceHowl: Howl;
  sound: (name: 'dice') => void;

  haptic: (t: HapticType) => void;

  lang: 'en' | 'he';
  rtl: boolean;
  setLang: (l: 'en' | 'he') => void;

  latencyHttpMs?: number;
  latencySocketMs?: number;
  setLatencyHttp: (ms?: number) => void;
  setLatencySocket: (ms?: number) => void;
};

export const useUIStore = create<UIState>((set, get) => {
  const diceHowl = new Howl({ src: [base64Dice], volume: 0.4 });

  return {
    highContrast: false,
    setHighContrast: (v) => set({ highContrast: v }),

    soundOn: true,
    setSoundOn: (v) => set({ soundOn: v }),

    diceHowl,
    sound: (name) => {
      if (!get().soundOn) return;
      if (name === 'dice') get().diceHowl.play();
    },

    haptic: (t) => {
      const h = window.Telegram?.WebApp?.HapticFeedback;
      if (!h) return;
      if (t === 'impact') h.impactOccurred?.('light');
      if (t === 'success') h.notificationOccurred?.('success');
      if (t === 'warning') h.notificationOccurred?.('warning');
      if (t === 'error') h.notificationOccurred?.('error');
    },

    lang: 'en',
    rtl: false,
    setLang: (l) => set({ lang: l, rtl: l === 'he' }),

    latencyHttpMs: undefined,
    latencySocketMs: undefined,
    setLatencyHttp: (ms) => set({ latencyHttpMs: ms }),
    setLatencySocket: (ms) => set({ latencySocketMs: ms })
  };
});
