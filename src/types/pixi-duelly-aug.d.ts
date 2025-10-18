// DUELLY: augment minimal props for compatibility
declare module 'pixi.js' {
  interface Graphics {
    polygon?: (...args: any[]) => any;
    buttonMode?: boolean;
  }
}
