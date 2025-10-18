import { create } from 'zustand';
import { Howl } from 'howler';
import { base64Dice } from '../assets/soundsBase64';
export var useUIStore = create(function (set, get) {
    var diceHowl = new Howl({ src: [base64Dice], volume: 0.4 });
    return {
        highContrast: false,
        setHighContrast: function (v) { return set({ highContrast: v }); },
        soundOn: true,
        setSoundOn: function (v) { return set({ soundOn: v }); },
        diceHowl: diceHowl,
        sound: function (name) {
            if (!get().soundOn)
                return;
            if (name === 'dice')
                get().diceHowl.play();
        },
        haptic: function (t) {
            var _a, _b, _c, _d, _e, _f;
            var h = (_b = (_a = window.Telegram) === null || _a === void 0 ? void 0 : _a.WebApp) === null || _b === void 0 ? void 0 : _b.HapticFeedback;
            if (!h)
                return;
            if (t === 'impact')
                (_c = h.impactOccurred) === null || _c === void 0 ? void 0 : _c.call(h, 'light');
            if (t === 'success')
                (_d = h.notificationOccurred) === null || _d === void 0 ? void 0 : _d.call(h, 'success');
            if (t === 'warning')
                (_e = h.notificationOccurred) === null || _e === void 0 ? void 0 : _e.call(h, 'warning');
            if (t === 'error')
                (_f = h.notificationOccurred) === null || _f === void 0 ? void 0 : _f.call(h, 'error');
        },
        lang: 'en',
        rtl: false,
        setLang: function (l) { return set({ lang: l, rtl: l === 'he' }); },
        latencyHttpMs: undefined,
        latencySocketMs: undefined,
        setLatencyHttp: function (ms) { return set({ latencyHttpMs: ms }); },
        setLatencySocket: function (ms) { return set({ latencySocketMs: ms }); }
    };
});
