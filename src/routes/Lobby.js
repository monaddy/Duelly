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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetStore } from '../store/useNetStore';
import TwaMainButton from '../components/TwaMainButton';
import { useSessionStore } from '../store/useSessionStore';
import { t } from '../utils/i18n';
export default function Lobby() {
    var _this = this;
    var _a = useState(1), stake = _a[0], setStake = _a[1];
    var _b = useState(null), inviteCode = _b[0], setInviteCode = _b[1];
    var _c = useNetStore(), socket = _c.socket, connected = _c.connected;
    var setLastMatchId = useSessionStore().setLastMatchId;
    var nav = useNavigate();
    var findQuick = function () {
        socket === null || socket === void 0 ? void 0 : socket.emit('findQuickMatch', { stake: stake });
        socket === null || socket === void 0 ? void 0 : socket.once('matchFound', function (_a) {
            var matchId = _a.matchId;
            setLastMatchId(matchId);
            nav("/game/".concat(matchId));
        });
    };
    var createPrivate = function () {
        socket === null || socket === void 0 ? void 0 : socket.emit('createPrivateMatch', { stake: stake });
        socket === null || socket === void 0 ? void 0 : socket.once('privateCreated', function (_a) {
            var code = _a.code;
            return setInviteCode(code);
        });
    };
    var joinPrivate = function () {
        var code = prompt('Enter invite code');
        if (!code)
            return;
        socket === null || socket === void 0 ? void 0 : socket.emit('joinPrivateMatch', { code: code });
        socket === null || socket === void 0 ? void 0 : socket.once('matchFound', function (_a) {
            var matchId = _a.matchId;
            setLastMatchId(matchId);
            nav("/game/".concat(matchId));
        });
    };
    var practiceAi = function () {
        socket === null || socket === void 0 ? void 0 : socket.emit('practiceVsAi', { difficulty: 'normal' });
        socket === null || socket === void 0 ? void 0 : socket.once('matchFound', function (_a) {
            var matchId = _a.matchId;
            setLastMatchId(matchId);
            nav("/game/".concat(matchId));
        });
    };
    var copyLink = function () { return __awaiter(_this, void 0, void 0, function () {
        var link;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!inviteCode)
                        return [2 /*return*/];
                    link = "".concat(location.origin, "/?join=").concat(inviteCode);
                    return [4 /*yield*/, navigator.clipboard.writeText(link)];
                case 1:
                    _a.sent();
                    alert(t('copied'));
                    return [2 /*return*/];
            }
        });
    }); };
    var _d = useState(true), mbVisible = _d[0], setMbVisible = _d[1];
    useEffect(function () { return setMbVisible(true); }, []);
    return (_jsxs(_Fragment, { children: [_jsx(TwaMainButton, { visible: mbVisible, text: t('findMatch'), onClick: findQuick }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("section", { className: "card", children: [_jsx("h2", { className: "text-2xl font-semibold mb-2", children: t('quickMatch') }), _jsx("p", { className: "text-muted mb-4", children: "Stake split: winner 90%, house 10%." }), _jsx("label", { className: "block mb-3 text-sm text-muted", children: t('stakeCredits') }), _jsx("input", { "aria-label": "Stake amount", className: "w-full accent-accent", type: "range", min: 1, max: 50, step: 1, value: stake, onChange: function (e) { return setStake(parseInt(e.target.value)); } }), _jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsx("div", { className: "text-2xl font-bold", children: stake }), _jsx("button", { className: "btn btn-accent", onClick: findQuick, disabled: !connected, children: t('findMatch') })] }), !connected && _jsx("p", { className: "mt-2 text-danger", children: t('connecting') })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { className: "text-2xl font-semibold mb-2", children: t('privateMatch') }), _jsx("p", { className: "text-muted mb-4", children: "Create a match and share the invite link/code." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn btn-accent", onClick: createPrivate, disabled: !connected, children: t('create') }), _jsx("button", { className: "btn", onClick: joinPrivate, disabled: !connected, children: t('join') })] }), inviteCode && (_jsxs("div", { className: "mt-4 p-3 rounded-lg border border-white/10", children: [_jsx("div", { className: "text-sm text-muted", children: "Invite Code" }), _jsx("div", { className: "text-xl font-mono", children: inviteCode }), _jsx("div", { className: "mt-2 flex gap-2", children: _jsx("button", { className: "btn btn-accent", onClick: copyLink, children: t('copyLink') }) })] }))] }), _jsxs("section", { className: "card md:col-span-2", children: [_jsx("h2", { className: "text-2xl font-semibold mb-2", children: t('practiceVsAi') }), _jsx("p", { className: "text-muted mb-4", children: "Free practice vs wildbg (server-hosted engine)." }), _jsx("div", { className: "flex gap-2", children: _jsx("button", { className: "btn btn-accent", onClick: practiceAi, disabled: !connected, children: t('startPractice') }) })] })] })] }));
}
