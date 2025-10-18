/**
 * Shim for Pixi v7 Graphics – allow legacy v6-style calls with arbitrary args
 * to silence TS2554 until code is migrated.
 */
declare module '@pixi/graphics' {
  interface Graphics {
    [key: string]: any;
  }
}
declare module 'pixi.js' {
  interface Graphics {
    [key: string]: any;
  }
}
