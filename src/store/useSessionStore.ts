import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SessionState = {
  lastMatchId?: string;
  setLastMatchId: (id?: string) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      lastMatchId: undefined,
      setLastMatchId: (id) => set({ lastMatchId: id })
    }),
    { name: 'bg-session' }
  )
);
