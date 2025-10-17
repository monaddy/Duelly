import { create } from 'zustand';
import type { GameState } from '../utils/types';

type GameStore = {
  matchId?: string;
  setMatchId: (id: string) => void;
  myColor: 'white' | 'black';
  state: GameState | null;
  setState: (s: GameState) => void;
  lastVersion: number;
  setLastVersion: (v: number) => void;

  tapSelection: { origin: number } | null;
  setTapSelection: (sel: { origin: number } | null) => void;

  subscribeState: (fn: () => void) => () => void;
};

export const useGameStore = create<GameStore>((set, get, api) => ({
  matchId: undefined,
  setMatchId: (id) => set({ matchId: id }),
  myColor: 'white',
  state: null,
  setState: (s) => set({ state: s }),
  lastVersion: 0,
  setLastVersion: (v) => set({ lastVersion: v }),

  tapSelection: null,
  setTapSelection: (sel) => set({ tapSelection: sel }),

  subscribeState: (fn) => {
    const unsub = api.subscribe((st, prev) => {
      if (st.state !== prev.state) fn();
    });
    return unsub;
  }
}));
