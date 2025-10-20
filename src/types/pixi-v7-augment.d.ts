import 'pixi.js';
declare module 'pixi.js' {
  interface Graphics {
    polygon(points: number[] | import('pixi.js').IPointData[], close?: boolean): this;
  }
  interface DestroyOptions {
    textureSource?: boolean;
  }
}
