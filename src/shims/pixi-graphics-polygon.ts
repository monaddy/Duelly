import { Graphics } from 'pixi.js';
declare module 'pixi.js' { interface Graphics { polygon(points: number[] | { x: number; y: number }[], close?: boolean): this; } }
(function attachPolygon() {
  const proto = (Graphics as any).prototype;
  if (typeof proto.polygon === 'function') return;
  proto.polygon = function(points: number[] | { x: number; y: number }[], close: boolean = true) {
    const g = this as Graphics;
    const arr: any[] = Array.isArray(points) ? (points as any[]) : [];
    let firstX: number|null = null, firstY: number|null = null;
    const pushPoint = (x:number, y:number, i:number) => { if (i===0) { g.moveTo(x,y); firstX=x; firstY=y; } else { g.lineTo(x,y); } };
    if (arr.length) {
      if (typeof arr[0] === 'number') { for (let i=0;i<arr.length;i+=2) pushPoint(arr[i], arr[i+1], i/2); }
      else { for (let i=0;i<arr.length;i++) { const p=arr[i] as { x: number; y: number }; pushPoint(p.x,p.y,i); } }
    }
    if (close && firstX!=null && firstY!=null) g.lineTo(firstX, firstY);
    return g;
  };
})();
