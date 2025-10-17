import type { Socket } from 'socket.io-client';
import { useUIStore } from '../store/useUIStore';

function baseFromSocketUrl(socketUrl: string): string {
  try {
    const u = new URL(socketUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return location.origin;
  }
}

export function startMetrics(socket: Socket, socketUrl: string) {
  const base = baseFromSocketUrl(socketUrl);

  let httpTimer: number | undefined;
  let sockTimer: number | undefined;
  let pingId = 0;

  const httpPing = async () => {
    const t0 = performance.now();
    try {
      await fetch(`${base}/health`, { cache: 'no-store' });
      const t1 = performance.now();
      useUIStore.getState().setLatencyHttp(Math.round(t1 - t0));
    } catch {
      useUIStore.getState().setLatencyHttp(undefined);
    }
  };

  const socketPing = () => {
    const id = `${Date.now()}-${++pingId}`;
    const t0 = performance.now();
    socket.emit('clientPing', { id, ts: Date.now() });
    const onPong = (d: { id: string; ts: number }) => {
      if (d.id !== id) return;
      const t1 = performance.now();
      useUIStore.getState().setLatencySocket(Math.round(t1 - t0));
      socket.off('serverPong', onPong);
    };
    socket.on('serverPong', onPong);
  };

  httpPing();
  socketPing();

  httpTimer = window.setInterval(httpPing, 10000);
  sockTimer = window.setInterval(socketPing, 10000);

  return () => {
    if (httpTimer) clearInterval(httpTimer);
    if (sockTimer) clearInterval(sockTimer);
  };
}
