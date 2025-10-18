var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { verifyCommit, deriveRollBytes, mapBytesToDicePair } from '../utils/fairness';
import { useGameStore } from '../store/useGameStore';
export default function Fairness() {
    var _this = this;
    var _a, _b;
    var state = useGameStore().state;
    var _c = useState((_a = state === null || state === void 0 ? void 0 : state.rngCommit) !== null && _a !== void 0 ? _a : ''), commitHex = _c[0], setCommitHex = _c[1];
    var _d = useState(''), secretHex = _d[0], setSecretHex = _d[1];
    var _e = useState(''), salt = _e[0], setSalt = _e[1];
    var _f = useState((_b = state === null || state === void 0 ? void 0 : state.matchId) !== null && _b !== void 0 ? _b : ''), gameId = _f[0], setGameId = _f[1];
    var _g = useState(0), rollIndex = _g[0], setRollIndex = _g[1];
    var _h = useState(''), status = _h[0], setStatus = _h[1];
    var _j = useState(null), dice = _j[0], setDice = _j[1];
    var message = useMemo(function () { return "".concat(salt, "|").concat(gameId, "|").concat(rollIndex); }, [salt, gameId, rollIndex]);
    var onVerify = function () { return __awaiter(_this, void 0, void 0, function () {
        var ok, bytes, pair, e_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setStatus('Verifying…');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, verifyCommit(secretHex, message, commitHex)];
                case 2:
                    ok = _b.sent();
                    setStatus(ok ? '✅ Commit matches reveal' : '❌ Commit mismatch');
                    if (!ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, deriveRollBytes(secretHex, message)];
                case 3:
                    bytes = _b.sent();
                    pair = mapBytesToDicePair(bytes);
                    setDice(pair);
                    return [3 /*break*/, 5];
                case 4:
                    setDice(null);
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_1 = _b.sent();
                    setStatus("Error: ".concat((_a = e_1.message) !== null && _a !== void 0 ? _a : String(e_1)));
                    setDice(null);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "max-w-2xl", children: [_jsx("h1", { className: "text-2xl font-semibold mb-4", children: "Fairness Proof (Client Verifier)" }), _jsxs("div", { className: "grid gap-3", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-muted", children: "Commit (hex HMAC\u2011SHA256)" }), _jsx("input", { className: "mt-1 w-full p-3 rounded-xl bg-surface border border-white/10", value: commitHex, onChange: function (e) { return setCommitHex(e.target.value.trim()); }, placeholder: "e.g. 9fe3\u2026", "aria-label": "Commit hex" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-muted", children: "Reveal Secret (hex key)" }), _jsx("input", { className: "mt-1 w-full p-3 rounded-xl bg-surface border border-white/10", value: secretHex, onChange: function (e) { return setSecretHex(e.target.value.trim()); }, placeholder: "hex key", "aria-label": "Reveal secret" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-muted", children: "Salt (string)" }), _jsx("input", { className: "mt-1 w-full p-3 rounded-xl bg-surface border border-white/10", value: salt, onChange: function (e) { return setSalt(e.target.value); }, placeholder: "server salt", "aria-label": "Salt" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-muted", children: "Game ID" }), _jsx("input", { className: "mt-1 w-full p-3 rounded-xl bg-surface border border-white/10", value: gameId, onChange: function (e) { return setGameId(e.target.value); }, placeholder: "matchId", "aria-label": "Game ID" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-muted", children: "Roll Index (0\u2011based)" }), _jsx("input", { className: "mt-1 w-full p-3 rounded-xl bg-surface border border-white/10", type: "number", min: 0, value: rollIndex, onChange: function (e) { return setRollIndex(parseInt(e.target.value || '0')); }, "aria-label": "Roll index" })] }), _jsx("button", { className: "btn btn-accent", onClick: onVerify, children: "Verify" }), status && _jsx("div", { className: "mt-2", children: status }), dice && (_jsxs("div", { className: "mt-2 text-lg", children: ["Derived dice (no modulo bias): ", _jsx("b", { children: dice[0] }), " & ", _jsx("b", { children: dice[1] })] }))] })] }));
}
