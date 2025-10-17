export type Point = { owner: 'white' | 'black' | null; count: number };

export type GameState = {
  version: number;
  matchId: string;
  stake: number;

  currentTurn: 'white' | 'black';

  points: Point[];
  bar: { white: number; black: number };
  borneOff: { white: number; black: number };

  dice: { values: [number, number]; rolling?: boolean; locked: boolean };

  cube: {
    value: number;
    owner: 'white' | 'black' | null;
    canOffer: boolean;
    pending?: { offeredBy: 'white' | 'black'; offeredTo: 'white' | 'black' };
  };

  timers: { whiteMs: number; blackMs: number; perMoveMs: number };

  players: { white?: { id: string; name: string }; black?: { id: string; name: string } };

  rngCommit?: string;
};
