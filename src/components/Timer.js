import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
export default function Timer(_a) {
    var _b, _c;
    var who = _a.who;
    var state = useGameStore().state;
    var _d = useState((_c = (_b = state === null || state === void 0 ? void 0 : state.timers) === null || _b === void 0 ? void 0 : _b["".concat(who, "Ms")]) !== null && _c !== void 0 ? _c : 0), ms = _d[0], setMs = _d[1];
    useEffect(function () {
        var _a, _b;
        setMs((_b = (_a = state === null || state === void 0 ? void 0 : state.timers) === null || _a === void 0 ? void 0 : _a["".concat(who, "Ms")]) !== null && _b !== void 0 ? _b : 0);
    }, [state, who]);
    useEffect(function () {
        var raf;
        var last = performance.now();
        var tick = function (now) {
            if ((state === null || state === void 0 ? void 0 : state.currentTurn) === who) {
                var delta_1 = now - last;
                setMs(function (prev) { return Math.max(0, prev - delta_1); });
            }
            last = now;
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return function () { return cancelAnimationFrame(raf); };
    }, [state === null || state === void 0 ? void 0 : state.currentTurn, who]);
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var sec = s % 60;
    var danger = ms < 10000;
    var inGrace = ms < 5000;
    return (_jsxs("div", { className: 'p-3 rounded-xl border ' + (danger ? 'border-danger' : 'border-white/10'), children: [_jsxs("div", { className: "text-sm text-muted", children: [who.toUpperCase(), " TIME"] }), _jsxs("div", { className: 'text-2xl font-bold ' + (danger ? 'text-danger' : ''), children: [m, ":", sec.toString().padStart(2, '0'), " ", inGrace && _jsx("span", { className: "text-sm", children: "(+grace)" })] })] }));
}
