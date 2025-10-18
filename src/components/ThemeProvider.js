import { useEffect } from 'react';
import { applyTelegramThemeParams } from '../utils/theme';
import { useUIStore } from '../store/useUIStore';
export default function ThemeProvider(_a) {
    var children = _a.children;
    var setThemeFromTG = function () {
        var _a;
        var tg = (_a = window.Telegram) === null || _a === void 0 ? void 0 : _a.WebApp;
        applyTelegramThemeParams(tg === null || tg === void 0 ? void 0 : tg.themeParams);
    };
    var _b = useUIStore(), setLang = _b.setLang, rtl = _b.rtl;
    useEffect(function () {
        var _a, _b, _c, _d, _e;
        setThemeFromTG();
        var tg = (_a = window.Telegram) === null || _a === void 0 ? void 0 : _a.WebApp;
        tg === null || tg === void 0 ? void 0 : tg.onEvent('themeChanged', setThemeFromTG);
        (_b = tg === null || tg === void 0 ? void 0 : tg.expand) === null || _b === void 0 ? void 0 : _b.call(tg);
        (_c = tg === null || tg === void 0 ? void 0 : tg.enableClosingConfirmation) === null || _c === void 0 ? void 0 : _c.call(tg);
        var lang = (_e = (_d = tg === null || tg === void 0 ? void 0 : tg.initDataUnsafe) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.language_code;
        if (lang === null || lang === void 0 ? void 0 : lang.toLowerCase().startsWith('he'))
            setLang('he');
        else
            setLang('en');
        return function () { var _a; return (_a = tg === null || tg === void 0 ? void 0 : tg.offEvent) === null || _a === void 0 ? void 0 : _a.call(tg, 'themeChanged', setThemeFromTG); };
    }, [setLang]);
    useEffect(function () {
        var el = document.documentElement;
        el.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    }, [rtl]);
    var haptic = useUIStore().haptic;
    useEffect(function () {
        haptic('impact');
    }, [haptic]);
    return children;
}
