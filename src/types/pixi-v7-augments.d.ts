/**
 * Pixi v7 splits types across packages. These augmentations relax signatures
 * so legacy v6-style code compiles during beta.
 */
declare module '@pixi/app'      { export class Application { [k:string]: any } }
declare module '@pixi/display'  { export class Container  { [k:string]: any } }
declare module '@pixi/text'     { export class Text       { [k:string]: any } }
declare module '@pixi/graphics' {
  export class Graphics { [k:string]: any
    clear?(...args: any[]): any
    roundRect?(...args: any[]): any
    moveTo?(...args: any[]): any
    endFill?(...args: any[]): any
    buttonMode?: boolean
    polygon?(...args: any[]): any
  }
}
declare module 'pixi.js' {
  export class Application { [k:string]: any }
  export class Container  { [k:string]: any }
  export class Text       { [k:string]: any }
  export class Graphics   { [k:string]: any
    clear?(...args: any[]): any
    roundRect?(...args: any[]): any
    moveTo?(...args: any[]): any
    endFill?(...args: any[]): any
    buttonMode?: boolean
    polygon?(...args: any[]): any
  }
}
