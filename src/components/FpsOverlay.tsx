import React, { useEffect, useRef, useState } from 'react';

type Props = { enabled?: boolean };

export default function FpsOverlay({ enabled = false }: Props) {
  const [fps, setFps] = useState(0);
  const rafId = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const frames = useRef<number>(0);
  const acc = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return () => {};
    const tick = (t: number) => {
      const prev = last.current ?? t;
      const dt = t - prev;
      last.current = t;
      frames.current += 1;
      acc.current += dt;
      if (acc.current >= 500) { // update twice a second, stable readout
        const f = (frames.current / acc.current) * 1000;
        setFps(Math.round(f));
        frames.current = 0;
        acc.current = 0;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => { try { if (rafId.current) cancelAnimationFrame(rafId.current); } catch {} };
  }, [enabled]);

  if (!enabled) return null;

  // lightweight DOM overlay; actual styles come from Tailwind classes present in the app
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 8,
        bottom: 8,
        fontSize: 12,
        lineHeight: '16px',
        padding: '6px 8px',
        borderRadius: 6,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        zIndex: 2147483647
      }}
    >
      FPS: {fps}
    </div>
  );
}
