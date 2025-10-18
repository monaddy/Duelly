/**
 * Pixi v7 export surface differs from v6. This shim makes common v6-style
 * named exports available (both as types & runtime values) from 'pixi.js'.
 */
declare module 'pixi.js' {
  export class Application { [key: string]: any }
  export class Container { [key: string]: any }
  export class Text { [key: string]: any }
  export class Graphics { [key: string]: any
    clear?(...args: any[]): any
    roundRect?(...args: any[]): any
    moveTo?(...args: any[]): any
    endFill?(...args: any[]): any
    buttonMode?: boolean
    polygon?(...args: any[]): any
  }
}
