export type Side = "A" | "B";

export interface Board {
  points: number[]; // 24 עמדות על הלוח (נשתמש בהמשך)
  barA: number;
  barB: number;
  offA: number;
  offB: number;
}

export const START_BOARD: Board = {
  points: [
    // לוח פתיחה קלאסי לפי Backgammon
    2, 0, 0, 0, 0, -5,
    0, -3, 0, 0, 0, 5,
    -5, 0, 0, 0, 3, 0,
    5, 0, 0, 0, 0, -2
  ],
  barA: 0,
  barB: 0,
  offA: 0,
  offB: 0,
};

export interface Move {
  from: number;
  to: number;
}
