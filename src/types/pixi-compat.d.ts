declare module 'pixi.js' {
  export const Graphics: any;  // value export guard
  interface Graphics {
    roundRect?(...args: any[]): any;
    moveTo?(...args: any[]): any;
    endFill?(...args: any[]): any;
    buttonMode?: boolean;
    polygon?(...args: any[]): any;
  }
}
