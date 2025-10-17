export function randomDicePips(value: number): [number, number][] {
  const c = 0.5, q = 0.25, t = 0.75;
  const map: Record<number, [number, number][]> = {
    1: [[c, c]],
    2: [[q, q], [t, t]],
    3: [[q, q], [c, c], [t, t]],
    4: [[q, q], [q, t], [t, q], [t, t]],
    5: [[q, q], [q, t], [c, c], [t, q], [t, t]],
    6: [[q, q], [q, c], [q, t], [t, q], [t, c], [t, t]]
  };
  return map[value] ?? map[1];
}
