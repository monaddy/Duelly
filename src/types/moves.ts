// Centralized move-target typing + resolver for Backgammon UI.
export type MoveTarget = number | 'bar' | 'bearoff-white' | 'bearoff-black';
export function resolveTo(to: MoveTarget | undefined, fallback: MoveTarget): MoveTarget {
  return (typeof to === 'undefined' ? fallback : to) as MoveTarget;
}
