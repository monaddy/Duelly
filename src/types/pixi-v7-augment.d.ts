import 'pixi.js';
type PointLike = { x: number; y: number };
declare module 'pixi.js' {
  interface Graphics {
    polygon(points: number[] | { x: number; y: number }[], close?: boolean): this;
  }
  interface DestroyOptions {
    textureSource?: boolean;
  }
}
