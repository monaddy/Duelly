import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../store/useUIStore';

export default function FpsOverlay() {
  if (!import.meta.env.DEV) return null;

  const [fps, setFps] = useState<number>(0);
  const rafRef = useRef<number>();
  const lastRef = useRef<number>(performance.now());
  const accRef = useRef<number[]>([]);
  const { latencyHttpMs, latencySocketMs } = useUIStore();

  useEffect(() => {
    const tick = (now: number) => {
      const dt = now - lastRef.current;
      lastRef.current = now;
      const inst = 1000 / Math.max(1, dt);
      accRef.current.push(inst);
      if (accRef.current.length > 20) accRef.current.shift();
      const avg = accRef.current.reduce((a, b) => a + b, 0) / accRef.current.length;
      setFps(Math.round(avg));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        background: 'rgba(17,24,39,0.8)',
        color: 'var(--tg-fg,#fff)',
        padding: '8px 10px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace',
        fontSize: 12,
        zIndex: 1000
      }}
      aria-label="Performance Overlay"
    >
      <div>FPS: <b>{fps}</b></div>
      <div>HTTP: {latencyHttpMs ?? '—'} ms</div>
      <div>Socket: {latencySocketMs ?? '—'} ms</div>
    </div>
  );
}
