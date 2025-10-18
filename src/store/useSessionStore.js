import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export var useSessionStore = create()(persist(function (set) { return ({
    lastMatchId: undefined,
    setLastMatchId: function (id) { return set({ lastMatchId: id }); }
}); }, { name: 'bg-session' }));
