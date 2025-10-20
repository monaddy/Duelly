import { useEffect, useMemo, useRef } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';
import { useUIStore } from '../store/useUIStore';
import { randomDicePips } from '../utils/dice';
import '../shims/pixi-graphics-polygon';

type MoveTarget = number | 'bar' | 'bearoff-white' | 'bearoff-black';
const BOARD_W = 900;
const BOARD_H = 600;
const PADDING = 16;
const TRI_W = (BOARD_W - PADDING * 2) / 14;
const TRI_H = (BOARD_H - PADDING * 2) / 2;
const CHECKER_R = Math.min(TRI_W, TRI_H / 5) * 0.48;

export default function PixiBoard() {
  const ref = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const diceLayerRef = useRef<Container | null>(null);
  const { state, myColor } = useGameStore();
  const { socket } = useNetStore();
  const { sound, haptic, rtl } = useUIStore();

  const isMyTurn = state?.currentTurn === myColor;

  const pointRects = useMemo(() => {
    const rects: { idx: number; x: number; y: number; w: number; h: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const col = rtl ? 11 - i : i;
      const x = PADDING + col * TRI_W + (col >= 6 ? TRI_W : 0);
      const y = PADDING;
      rects.push({ idx: 12 + i, x, y, w: TRI_W, h: TRI_H });
    }
    for (let i = 0; i < 12; i++) {
      const col = rtl ? i : 11 - i;
      const x = PADDING + col * TRI_W + (col >= 6 ? TRI_W : 0);
      const y = PADDING + TRI_H;
      rects.push({ idx: 11 - i, x, y, w: TRI_W, h: TRI_H });
    }
    return rects;
  }, [rtl]);

  const barRect = useMemo(() => {
    const x = PADDING + 6 * TRI_W;
    return { x, y: PADDING, w: TRI_W, h: BOARD_H - PADDING * 2 };
  }, []);

  const bearOffRects = useMemo(() => {
    return {
      white: { x: BOARD_W - PADDING - TRI_W / 1.5, y: PADDING + TRI_H, w: TRI_W / 1.5, h: TRI_H },
      black: { x: BOARD_W - PADDING - TRI_W / 1.5, y: PADDING, w: TRI_W / 1.5, h: TRI_H }
    };
  }, []);

  useEffect(() => {
    if (!ref.current) return;

    const app = new Application();
    appRef.current = app;
    app.init({ background: 'transparent', antialias: true, width: BOARD_W, height: BOARD_H })
      .then(() => {
        if (!ref.current) return;
        ref.current.appendChild(app.canvas);

        const g = new Graphics();
        drawBoard(g);
        app.stage.addChild(g);

        const checkersLayer = new Container();
        const uiLayer = new Container();
        const hudLayer = new Container();
        const diceLayer = new Container();
        diceLayerRef.current = diceLayer;
        app.stage.addChild(checkersLayer);
        app.stage.addChild(uiLayer);
        uiLayer.addChild(hudLayer);
        uiLayer.addChild(diceLayer);

        const stateToScene = () => {
          checkersLayer.removeChildren();
          hudLayer.removeChildren();
          diceLayer.removeChildren();

          const { state } = useGameStore.getState();
          if (!state) return;

          state.points.forEach((p, idx) => {
            if (!p.owner || p.count <= 0) return;
            const rect = pointRects.find((r) => r.idx === idx)!;
            const up = idx >= 12;
            for (let n = 0; n < p.count; n++) {
              const cx = rect.x + rect.w / 2;
              const cy =
                rect.y +
                (up ? rect.h - CHECKER_R - n * (CHECKER_R * 2 + 2) : CHECKER_R + n * (CHECKER_R * 2 + 2));
              const c = disk(p.owner);
              c.x = cx;
              c.y = cy;
              c.eventMode = 'static';
              c.cursor = isMyTurn && p.owner === myColor ? 'grab' : 'default';
              let dragging = false;
              let ox = 0, oy = 0;
              c.on('pointerdown', (ev) => {
                if (!(isMyTurn && p.owner === myColor)) return;
                dragging = true;
                c.cursor = 'grabbing';
                const { x, y } = ev.data.global;
                ox = c.x - x; oy = c.y - y;
                haptic('impact');
              });
              c.on('pointermove', (ev) => {
                if (!dragging) return;
                const { x, y } = ev.data.global;
                c.x = x + ox; c.y = y + oy;
              });
              c.on('pointerupoutside', () => { dragging = false; c.cursor = 'grab'; });
              c.on('pointerup', (ev) => {
                if (!dragging) return;
                dragging = false;
                c.cursor = 'grab';
                const { x, y } = ev.data.global;
                const dest = hitTestPoint(x, y, pointRects, barRect, bearOffRects);
                socket?.emit('moveAttempt', { from: idx, to: dest?.type === 'point' ? dest.idx : dest?.type });
              });
              c.on('pointertap', () => {
                if (!(isMyTurn && p.owner === myColor)) return;
                setTapSelection({ origin: idx });
                haptic('impact');
              });
              checkersLayer.addChild(c);
            }
          });

          const bar = new Graphics();
          bar.roundRect(barRect.x + 3, barRect.y + 3, barRect.w - 6, barRect.h - 6, 12).stroke({ color: 0xffffff, alpha: 0.05 });
          hudLayer.addChild(bar);

          if (state.bar.white > 0) {
            const t = new Text({ text: `W: ${state.bar.white}`, style: { fill: 0xffffff, fontSize: 14 } });
            t.x = barRect.x + 6; t.y = barRect.y + barRect.h - 22;
            hudLayer.addChild(t);
          }
          if (state.bar.black > 0) {
            const t = new Text({ text: `B: ${state.bar.black}`, style: { fill: 0xffffff, fontSize: 14 } });
            t.x = barRect.x + 6; t.y = barRect.y + 6;
            hudLayer.addChild(t);
          }

          const boW = new Text({ text: `W off: ${state.borneOff.white}`, style: { fill: 0xffffff, fontSize: 14 } });
          boW.x = bearOffRects.white.x - 80; boW.y = bearOffRects.white.y + bearOffRects.white.h - 22;
          hudLayer.addChild(boW);
          const boB = new Text({ text: `B off: ${state.borneOff.black}`, style: { fill: 0xffffff, fontSize: 14 } });
          boB.x = bearOffRects.black.x - 80; boB.y = bearOffRects.black.y + 6;
          hudLayer.addChild(boB);

          drawDice(diceLayer, state.dice.values, state.dice.rolling);
        };

        stateToScene();
        const unsub = useGameStore.getState().subscribeState(stateToScene);

        const onDice = ({ values }: { values: [number, number] }) => {
          if (diceLayerRef.current) animateDice(diceLayerRef.current, values);
          sound('dice');
          haptic('impact');
        };
        socket?.on('diceRolled', onDice);

        return () => {
          unsub();
          socket?.off('diceRolled', onDice);
          app.destroy(true, { children: true, texture: true, textureSource: true });
          appRef.current = null;
        };
      });
  }, [ref, pointRects, barRect, bearOffRects, socket, haptic, sound]);

  const setTapSelection = useGameStore((s) => s.setTapSelection);
  useEffect(() => {
    const onTapTarget = (ev: PointerEvent) => {
      const rect = (appRef.current?.canvas.getBoundingClientRect?.() ?? null);
      if (!rect) return;
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const dest = hitTestPoint(x, y, pointRects, barRect, bearOffRects);
      const { tapSelection } = useGameStore.getState();
      if (tapSelection?.origin != null && dest) {
        socket?.emit('moveAttempt', { from: tapSelection.origin, to: dest.type === 'point' ? dest.idx : dest.type });
        useGameStore.getState().setTapSelection(null);
      }
    };
    appRef.current?.canvas.addEventListener('click', onTapTarget);
    return () => appRef.current?.canvas.removeEventListener('click', onTapTarget);
  }, [pointRects, barRect, bearOffRects, socket]);

  return <div ref={ref} className="w-full flex justify-center items-center overflow-hidden"></div>;
}

function drawBoard(g: Graphics) {
  g.clear();
  g.roundRect(0, 0, BOARD_W, BOARD_H, 20).fill({ color: 0x0d1117 });
  g.roundRect(PADDING, PADDING, BOARD_W - PADDING * 2, BOARD_H - PADDING * 2, 16).fill({ color: 0x111827 });
  g.roundRect(PADDING + 6 * TRI_W, PADDING, TRI_W, BOARD_H - PADDING * 2, 12).fill({ color: 0x0b0d10 });
  for (let i = 0; i < 12; i++) {
    const x = PADDING + i * TRI_W + (i >= 6 ? TRI_W : 0);
    triangle(g, x, PADDING, TRI_W, TRI_H, i % 2 === 0 ? 0x374151 : 0x9ca3af, false);
    const xb = PADDING + (11 - i) * TRI_W + (11 - i >= 6 ? TRI_W : 0);
    triangle(g, xb, PADDING + TRI_H, TRI_W, TRI_H, i % 2 === 0 ? 0x374151 : 0x9ca3af, true);
  }
}

function triangle(g: Graphics, x: number, y: number, w: number, h: number, color: number, down: boolean) {
  g.moveTo(x, y).beginFill(color, 0.6);
  if (down) {
    g.polygon([x, y, x + w, y, x + w / 2, y + h - 6]);
  } else {
    g.polygon([x, y + h, x + w, y + h, x + w / 2, y + 6]);
  }
  g.endFill();
}

function disk(owner: 'white' | 'black') {
  const g = new Graphics();
  g.circle(0, 0, CHECKER_R).fill({ color: owner === 'white' ? 0xf3f4f6 : 0x111827 });
  g.circle(0, 0, CHECKER_R).stroke({ color: 0x000000, alpha: 0.35, width: 2 });
  g.eventMode = 'static';
  g.eventMode = 'static'; g.cursor = 'pointer';
  g.interactive = true;
  return g;
}

function drawDice(layer: Container, values: [number, number], rolling?: boolean) {
  const size = 56;
  const gap = 12;
  const startX = BOARD_W / 2 - size - gap / 2;
  const y = BOARD_H / 2 - size / 2;

  const drawOne = (x: number, value: number) => {
    const g = new Graphics();
    g.roundRect(x, y, size, size, 10).fill({ color: 0xf3f4f6 }).stroke({ color: 0x111827, width: 2 });
    const pips = randomDicePips(value);
    for (const p of pips) {
      const cx = x + size * p[0];
      const cy = y + size * p[1];
      g.circle(cx, cy, 4.5).fill({ color: 0x111827 });
    }
    layer.addChild(g);
  };

  drawOne(startX, values[0]);
  drawOne(startX + size + gap, values[1]);
}

function animateDice(layer: Container, finalValues: [number, number]) {
  layer.removeChildren();
  const animStart = performance.now();
  const duration = 680;

  const tick = (now: number) => {
    const t = now - animStart;
    layer.removeChildren();
    const v1 = (Math.floor(Math.random() * 6) + 1) as 1|2|3|4|5|6;
    const v2 = (Math.floor(Math.random() * 6) + 1) as 1|2|3|4|5|6;
    drawDice(layer, t >= duration ? finalValues : [v1, v2], false);
    if (t < duration) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

type Hit =
  | { type: 'point'; idx: number }
  | { type: 'bar' }
  | { type: 'bearoff-white' }
  | { type: 'bearoff-black' };

function hitTestPoint(
  x: number,
  y: number,
  rects: { idx: number; x: number; y: number; w: number; h: number }[],
  bar: { x: number; y: number; w: number; h: number },
  bo: { white: { x: number; y: number; w: number; h: number }, black: { x: number; y: number; w: number; h: number } }
): Hit | null {
  const r = rects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (r) return { type: 'point', idx: r.idx };
  if (x >= bar.x && x <= bar.x + bar.w && y >= bar.y && y <= bar.y + bar.h) return { type: 'bar' };
  const w = bo.white; const b = bo.black;
  if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return { type: 'bearoff-white' };
  if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return { type: 'bearoff-black' };
  return null;
}
