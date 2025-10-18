import React, { useEffect, useRef, useState } from "react";

export default function FpsOverlay() {
  const last = useRef<number>(performance.now());
  const [fps, setFps] = useState<number>(60);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    let frames = 0;
    let secStart = performance.now();

    const tick = () => {
      const now = performance.now();
      frames++;
      // once per ~500ms update estimate (smoother)
      if (now - secStart >= 500) {
        const delta = (now - secStart) / 1000;
        setFps(Math.round(frames / delta));
        frames = 0;
        secStart = now;
      }
      last.current = now;
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, []);

  const boxStyle: React.CSSProperties = {
    position: "fixed",
    right: 10,
    bottom: 10,
    padding: "6px 9px",
    borderRadius: 8,
    background: "rgba(0,0,0,.55)",
    color: fps >= 55 ? "#C6F6D5" : "#FED7D7",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 12,
    zIndex: 9999,
    pointerEvents: "none"
  };
  return <div style={boxStyle}>FPS: {fps}</div>;
}
