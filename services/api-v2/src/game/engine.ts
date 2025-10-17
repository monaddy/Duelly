import type { PrismaClient } from "@prisma/client";
import { START_BOARD, Board, Move } from "./types.js";
export async function validateAndApplyMoves(px: PrismaClient, matchId: string, moves: Move[]) {
  const match = await px.match.findUniqueOrThrow({ where: { id: matchId }, select: { id: true, turn: true, boardJson: true } });
  const board: Board = (match.boardJson as any as Board) ?? START_BOARD;
  await px.match.update({ where: { id: matchId }, data: { boardJson: board as any, turn: match.turn === "A" ? "B" : "A" } });
  return { ok: true, board };
}
