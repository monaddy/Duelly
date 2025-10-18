import { create } from 'zustand';
export var useGameStore = create(function (set, get, api) { return ({
    matchId: undefined,
    setMatchId: function (id) { return set({ matchId: id }); },
    myColor: 'white',
    state: null,
    setState: function (s) { return set({ state: s }); },
    lastVersion: 0,
    setLastVersion: function (v) { return set({ lastVersion: v }); },
    tapSelection: null,
    setTapSelection: function (sel) { return set({ tapSelection: sel }); },
    subscribeState: function (fn) {
        var unsub = api.subscribe(function (st, prev) {
            if (st.state !== prev.state)
                fn();
        });
        return unsub;
    }
}); });
