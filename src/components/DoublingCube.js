import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';
export default function DoublingCube() {
    var _a;
    var _b = useGameStore(), state = _b.state, myColor = _b.myColor;
    var socket = useNetStore().socket;
    if (!state)
        return null;
    var canOffer = state.cube.canOffer && state.currentTurn === myColor && !state.cube.pending && state.dice.locked;
    var onOffer = function () { return socket === null || socket === void 0 ? void 0 : socket.emit('offerDouble'); };
    var onTake = function () { return socket === null || socket === void 0 ? void 0 : socket.emit('takeDouble'); };
    var onPass = function () { return socket === null || socket === void 0 ? void 0 : socket.emit('passDouble'); };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-muted", children: "Doubling Cube" }), _jsxs("div", { className: "text-3xl font-extrabold", children: [state.cube.value, "\u00D7"] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn", onClick: onOffer, disabled: !canOffer, children: "Offer Double" }), state.cube.pending && state.cube.pending.offeredTo === myColor && (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn btn-accent", onClick: onTake, children: "Take" }), _jsx("button", { className: "btn btn-danger", onClick: onPass, children: "Pass" })] }))] })] }), _jsxs("div", { className: "mt-2 text-sm text-muted", children: ["Owner: ", (_a = state.cube.owner) !== null && _a !== void 0 ? _a : '—', " | Pending: ", state.cube.pending ? 'Yes' : 'No'] })] }));
}
