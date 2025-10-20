import 'pixi.js';
declare module 'pixi.js' {
  interface Graphics {
    polygon(points: number[] | { x: number; y: number }[], close?: boolean): this;
  }
  interface DestroyOptions {
    textureSource?: boolean;
  }
}
