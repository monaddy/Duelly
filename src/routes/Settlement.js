import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGameStore } from '../store/useGameStore';
import { t } from '../utils/i18n';
export default function Settlement() {
    var _a;
    var state = useGameStore().state;
    var stake = (_a = state === null || state === void 0 ? void 0 : state.stake) !== null && _a !== void 0 ? _a : 0;
    var winnerAmount = Math.round(stake * 0.9 * 100) / 100;
    var houseAmount = Math.round(stake * 0.1 * 100) / 100;
    var onPay = function () {
        var _a, _b, _c;
        var tg = (_a = window.Telegram) === null || _a === void 0 ? void 0 : _a.WebApp;
        if (tg === null || tg === void 0 ? void 0 : tg.openInvoice) {
            tg.openInvoice('demo-invoice', function (status) {
                alert("Invoice status: ".concat(status));
            });
        }
        else {
            (_c = (_b = tg === null || tg === void 0 ? void 0 : tg.HapticFeedback) === null || _b === void 0 ? void 0 : _b.notificationOccurred) === null || _c === void 0 ? void 0 : _c.call(_b, 'warning');
            alert('Payments are gated (CL‑05). Placeholder only.');
        }
    };
    return (_jsxs("div", { className: "card max-w-lg", children: [_jsx("h2", { className: "text-2xl font-semibold mb-3", children: t('settlement') }), _jsxs("div", { className: "grid gap-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: t('winner') }), _jsx("span", { className: "font-mono", children: winnerAmount })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: t('house') }), _jsx("span", { className: "font-mono", children: houseAmount })] }), _jsxs("div", { className: "text-sm text-muted mt-2", children: ["90/10 split \u2014 ", _jsx("b", { children: "CL\u201105" }), " rounding/timing TBD (placeholder)."] }), _jsx("button", { className: "btn btn-accent mt-3", onClick: onPay, children: t('payAndJoin') })] })] }));
}
