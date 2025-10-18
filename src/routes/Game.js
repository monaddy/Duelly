import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PixiBoard from '../components/PixiBoard';
import DoublingCube from '../components/DoublingCube';
import Timer from '../components/Timer';
import HUD from '../components/HUD';
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';
import { useUIStore } from '../store/useUIStore';
export default function Game() {
    var matchId = useParams().matchId;
    var _a = useGameStore(), setMatchId = _a.setMatchId, state = _a.state, setState = _a.setState, setLastVersion = _a.setLastVersion, lastVersion = _a.lastVersion;
    var _b = useNetStore(), socket = _b.socket, connected = _b.connected;
    var haptic = useUIStore().haptic;
    useEffect(function () {
        if (!matchId)
            return;
        setMatchId(matchId);
    }, [matchId, setMatchId]);
    useEffect(function () {
        if (!socket || !matchId)
            return;
        var onState = function (s) {
            var _a;
            setState(s);
            setLastVersion((_a = s === null || s === void 0 ? void 0 : s.version) !== null && _a !== void 0 ? _a : 0);
        };
        socket.on('state', onState);
        socket.emit('resume', { matchId: matchId, lastVersion: lastVersion });
        return function () {
            socket.off('state', onState);
        };
    }, [socket, matchId, setState, setLastVersion, lastVersion, state]);
    useEffect(function () {
        if (!connected)
            return;
        haptic('impact');
    }, [connected, haptic]);
    if (!state) {
        return _jsx("p", { className: "text-muted", children: "Waiting for match state\u2026" });
    }
    return (_jsxs("div", { className: "grid lg:grid-cols-[1fr_340px] gap-4", children: [_jsx("section", { className: "card", children: _jsx(PixiBoard, {}) }), _jsxs("aside", { className: "card", children: [_jsx(HUD, {}), _jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [_jsx(Timer, { who: "white" }), _jsx(Timer, { who: "black" })] }), _jsx("div", { className: "mt-4", children: _jsx(DoublingCube, {}) })] })] }));
}
