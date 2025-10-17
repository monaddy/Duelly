import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../network/events';
import { startMetrics } from '../utils/metrics';

type NetState = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connected: boolean;
  connect: () => void;
};

export const useNetStore = create<NetState>((set) => ({
  socket: null,
  connected: false,
  connect: () => {
    const initData = window.Telegram?.WebApp?.initData ?? '';
    const url = import.meta.env.VITE_SOCKET_URL ?? '/';
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      auth: { initData }
    });

    let stopMetrics: (() => void) | null = null;

    socket.on('connect', () => {
      set({ connected: true });
      stopMetrics?.();
      stopMetrics = startMetrics(socket, url);
    });
    socket.on('disconnect', () => {
      set({ connected: false });
      stopMetrics?.();
      stopMetrics = null;
    });

    set({ socket });
  }
}));

useNetStore.getState().connect();
