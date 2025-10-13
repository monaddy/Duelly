import type { PrismaClient } from "@prisma/client";
import { START_BOARD, Board, Move, Side } from "./types.js";

/**
 * Validate and apply a move sequence on the current board.
 * Persists the new boardJson + toggles turn.
 */
export async function validateAndApplyMoves(px: PrismaClient, matchId: string, moves: Move[]) {
  const match = await px.match.findUniqueOrThrow({
    where: { id: matchId },
    select: { id: true, roomId: true, turn: true, boardJson: true },
  });

  // טען מצב קיים או לוח פתיחה
  const board: Board = (match.boardJson as any as Board) ?? START_BOARD;

  // פה בהמשך נוסיף לוגיקה אמיתית של בדיקת מהלכים
  // כרגע: רק מדמה עדכון פשוט של "תור"
  const side = match.turn;
  const newTurn = side === "A" ? "B" : "A";

  // שמירה ל־DB
  await px.match.update({
    where: { id: matchId },
    data: {
      turn: newTurn,
      boardJson: board as any,
    },
  });

  return { ok: true, board, roomId: match.roomId! };
}
