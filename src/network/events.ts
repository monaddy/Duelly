import type { GameState } from '../utils/types';

export type ServerToClientEvents = {
  connected: (payload: { ok: true }) => void;

  state: (s: GameState) => void;

  matchFound: (data: { matchId: string }) => void;
  privateCreated: (data: { code: string }) => void;

  diceRolled: (data: { values: [number, number]; rollIndex: number; commit?: string }) => void;

  serverPong: (data: { id: string; ts: number }) => void;

  error: (msg: string) => void;
};

export type ClientToServerEvents = {
  resume: (data: { matchId: string; lastVersion: number }) => void;

  findQuickMatch: (data: { stake: number }) => void;
  createPrivateMatch: (data: { stake: number }) => void;
  joinPrivateMatch: (data: { code: string }) => void;

  practiceVsAi: (data: { difficulty: 'easy' | 'normal' | 'hard' }) => void;

  moveAttempt: (data: { from: number; to: number | 'bar' | 'bearoff-white' | 'bearoff-black' }) => void;

  offerDouble: () => void;
  takeDouble: () => void;
  passDouble: () => void;

  clientPing: (data: { id: string; ts: number }) => void;
};
