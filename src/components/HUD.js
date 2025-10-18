import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';
export default function HUD() {
    var _a, _b, _c, _d;
    var state = useGameStore().state;
    var connected = useNetStore().connected;
    if (!state)
        return null;
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-muted", children: "Match" }), _jsx("div", { className: "font-mono", children: state.matchId })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm text-muted", children: "Stake" }), _jsxs("div", { className: "text-xl font-semibold", children: [state.stake, " credits"] })] })] }), _jsxs("div", { className: "mt-3 grid grid-cols-2 gap-3", children: [_jsx(PlayerCard, { name: (_b = (_a = state.players.white) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'White', color: "white" }), _jsx(PlayerCard, { name: (_d = (_c = state.players.black) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : 'Black', color: "black" })] }), _jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "text-sm text-muted", children: "Cube" }), _jsxs("div", { className: "text-lg", children: [state.cube.value, "x ", state.cube.owner ? "(owned by ".concat(state.cube.owner, ")") : '(centered)', state.cube.pending && (_jsxs("span", { className: "ml-2 text-accent", children: ["Pending offer by ", state.cube.pending.offeredBy] }))] })] }), _jsxs("div", { className: "mt-3 text-sm", children: ["Connection: ", connected ? _jsx("span", { className: "text-accent", children: "Online" }) : 'Reconnecting…'] }), state.rngCommit && (_jsxs("div", { className: "mt-3 text-sm", children: [_jsx("div", { className: "text-muted", children: "RNG commit" }), _jsx("div", { className: "font-mono break-all", children: state.rngCommit })] }))] }));
}
function PlayerCard(_a) {
    var name = _a.name, color = _a.color;
    return (_jsxs("div", { className: "p-3 rounded-xl border border-white/10", children: [_jsx("div", { className: "text-sm text-muted", children: color.toUpperCase() }), _jsx("div", { className: "text-lg font-semibold", children: name })] }));
}
