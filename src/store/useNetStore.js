import { create } from 'zustand';
import { io } from 'socket.io-client';
import { startMetrics } from '../utils/metrics';
export var useNetStore = create(function (set) { return ({
    socket: null,
    connected: false,
    connect: function () {
        var _a, _b, _c, _d;
        var initData = (_c = (_b = (_a = window.Telegram) === null || _a === void 0 ? void 0 : _a.WebApp) === null || _b === void 0 ? void 0 : _b.initData) !== null && _c !== void 0 ? _c : '';
        var url = (_d = import.meta.env.VITE_SOCKET_URL) !== null && _d !== void 0 ? _d : '/';
        var socket = io(url, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            auth: { initData: initData }
        });
        var stopMetrics = null;
        socket.on('connect', function () {
            set({ connected: true });
            stopMetrics === null || stopMetrics === void 0 ? void 0 : stopMetrics();
            stopMetrics = startMetrics(socket, url);
        });
        socket.on('disconnect', function () {
            set({ connected: false });
            stopMetrics === null || stopMetrics === void 0 ? void 0 : stopMetrics();
            stopMetrics = null;
        });
        set({ socket: socket });
    }
}); });
useNetStore.getState().connect();
