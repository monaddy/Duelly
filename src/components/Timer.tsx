import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export default function Timer({ who }: { who: 'white' | 'black' }) {
  const { state } = useGameStore();
  const [ms, setMs] = useState<number>(state?.timers?.[`${who}Ms`] ?? 0);

  useEffect(() => {
    setMs(state?.timers?.[`${who}Ms`] ?? 0);
  }, [state, who]);

  useEffect(() => {
    let raf: number;
    let last = performance.now();

    const tick = (now: number) => {
      if (state?.currentTurn === who) {
        const delta = now - last;
        setMs((prev) => Math.max(0, prev - delta));
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state?.currentTurn, who]);

  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;

  const danger = ms < 10_000;
  const inGrace = ms < 5_000;

  return (
    <div className={'p-3 rounded-xl border ' + (danger ? 'border-danger' : 'border-white/10')}>
      <div className="text-sm text-muted">{who.toUpperCase()} TIME</div>
      <div className={'text-2xl font-bold ' + (danger ? 'text-danger' : '')}>
        {m}:{sec.toString().padStart(2, '0')} {inGrace && <span className="text-sm">(+grace)</span>}
      </div>
    </div>
  );
}
