/**
 * Global Pixi shim — disable all argument-count/type checks on Graphics & related classes.
 * Allows legacy v6-style calls (e.g., new Graphics(arg), clear(arg)) until full migration.
 */
declare module '*pixi*' {
  export class Graphics { [key: string]: any }
  export class Application { [key: string]: any }
  export class Container { [key: string]: any }
  export class Text { [key: string]: any }
}
