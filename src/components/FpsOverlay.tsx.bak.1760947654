import React, { useEffect, useRef, useState } from 'react';
export default function FpsOverlay() {
  const rafRef = useRef<number | null>(null);
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      frames++;
      acc += dt;
      if (acc >= 500) {
        setFps(Math.round((frames * 1000) / acc));
        frames = 0; acc = 0;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, []);
  return <div className="fps-overlay">{fps} FPS</div>;
}
