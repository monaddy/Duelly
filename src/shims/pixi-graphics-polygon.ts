// DUELLY runtime shim: Graphics.polygon(...)
import { Graphics } from 'pixi.js';
const G: any = Graphics as any;
if (G && !G.prototype.polygon) {
  G.prototype.polygon = function (...args: number[]) {
    if (args.length >= 6) {
      this.moveTo(args[0], args[1]);
      for (let i = 2; i < args.length; i += 2) this.lineTo(args[i], args[i+1]);
      if (typeof (this as any).closePath === 'function') (this as any).closePath();
    }
    return this;
  };
}
