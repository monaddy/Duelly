import { useEffect } from 'react';
export default function TwaMainButton(_a) {
    var visible = _a.visible, text = _a.text, onClick = _a.onClick;
    useEffect(function () {
        var _a, _b, _c, _d, _e, _f;
        var tg = (_a = window.Telegram) === null || _a === void 0 ? void 0 : _a.WebApp;
        var mb = tg === null || tg === void 0 ? void 0 : tg.MainButton;
        if (!mb)
            return;
        var handler = function () { return onClick(); };
        (_b = mb.setText) === null || _b === void 0 ? void 0 : _b.call(mb, text);
        if (visible)
            (_c = mb.show) === null || _c === void 0 ? void 0 : _c.call(mb);
        else
            (_d = mb.hide) === null || _d === void 0 ? void 0 : _d.call(mb);
        (_e = mb.offClick) === null || _e === void 0 ? void 0 : _e.call(mb, handler);
        (_f = mb.onClick) === null || _f === void 0 ? void 0 : _f.call(mb, handler);
        return function () {
            var _a, _b;
            (_a = mb === null || mb === void 0 ? void 0 : mb.offClick) === null || _a === void 0 ? void 0 : _a.call(mb, handler);
            (_b = mb === null || mb === void 0 ? void 0 : mb.hide) === null || _b === void 0 ? void 0 : _b.call(mb);
        };
    }, [visible, text, onClick]);
    return null;
}
