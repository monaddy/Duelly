// DUELLY: PixiJS type augmentations (safe)
import 'pixi.js';
declare module 'pixi.js' {
  interface Graphics {
    polygon?: (...args:any[])=>any;
    drawPolygon?: (...args:any[])=>any;
  }
  interface DisplayObject {
    eventMode?: any;
    cursor?: any;
  }
}
