import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as IOServer } from 'socket.io';
import crypto from 'node:crypto';

type Color = 'white' | 'black';
type Point = { owner: Color | null; count: number };

type GameState = {
  version: number;
  matchId: string;
  stake: number;
  currentTurn: Color;
  points: Point[];
  bar: { white: number; black: number };
  borneOff: { white: number; black: number };
  dice: { values: [number, number]; rolling?: boolean; locked: boolean };
  cube: {
    value: number;
    owner: Color | null;
    canOffer: boolean;
    pending?: { offeredBy: Color; offeredTo: Color };
  };
  timers: { whiteMs: number; blackMs: number; perMoveMs: number };
  players: { white?: { id: string; name: string }; black?: { id: string; name: string } };
  rngCommit?: string;
};

type Match = {
  id: string;
  stake: number;
  state: GameState;
  salt: string;
  secretHex: string;
  rollIndex: number;
};

const fastify = Fastify({ logger: false });
await fastify.register(cors, { origin: true });

fastify.get('/health', async () => ({ ok: true }));

const io = new IOServer(fastify.server, { cors: { origin: true } });

const matches = new Map<string, Match>();
const inviteCodeToMatch = new Map<string, string>();

function hex(buf: Buffer) { return buf.toString('hex'); }
function hmacHex(keyHex: string, message: string) {
  return crypto.createHmac('sha256', Buffer.from(keyHex, 'hex')).update(message).digest('hex');
}
function mapBytesToDicePair(bytes: Uint8Array): [number, number] {
  let i = 0;
  const one = () => { while (true) { if (i >= bytes.length) throw new Error('insufficient bytes'); const b = bytes[i++]; if (b < 252) return (b % 6) + 1; } };
  return [one(), one()];
}
function deriveBytes(secretHex: string, message: string) {
  const mac = hmacHex(secretHex, message);
  return Buffer.from(mac, 'hex');
}
function randomId(prefix = 'm') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }

function initialPoints(): Point[] {
  const arr: Point[] = Array.from({ length: 24 }, () => ({ owner: null, count: 0 }));
  arr[23] = { owner: 'white', count: 2 };
  arr[12] = { owner: 'white', count: 5 };
  arr[7]  = { owner: 'white', count: 3 };
  arr[5]  = { owner: 'white', count: 5 };
  arr[0]  = { owner: 'black', count: 2 };
  arr[11] = { owner: 'black', count: 5 };
  arr[16] = { owner: 'black', count: 3 };
  arr[18] = { owner: 'black', count: 5 };
  return arr;
}

function createMatch(stake = 1): Match {
  const id = randomId('m');
  const salt = 'devsalt';
  const secretHex = hex(crypto.randomBytes(32));
  const rollIndex = 0;
  const msg = `${salt}|${id}|${rollIndex}`;
  const commitHex = hmacHex(secretHex, msg);

  const state: GameState = {
    version: 1,
    matchId: id,
    stake,
    currentTurn: 'white',
    points: initialPoints(),
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    dice: { values: [1, 2], locked: true },
    cube: { value: 1, owner: null, canOffer: true },
    timers: { whiteMs: 27 * 60_000, blackMs: 27 * 60_000, perMoveMs: 45_000 },
    players: {},
    rngCommit: commitHex
  };
  const m: Match = { id, stake, state, salt, secretHex, rollIndex };
  matches.set(id, m);
  return m;
}

function nextCommitFor(m: Match) {
  const msg = `${m.salt}|${m.id}|${m.rollIndex}`;
  return hmacHex(m.secretHex, msg);
}

function rollDice(m: Match) {
  const msg = `${m.salt}|${m.id}|${m.rollIndex}`;
  const bytes = deriveBytes(m.secretHex, msg);
  const values = mapBytesToDicePair(bytes);
  m.rollIndex += 1;
  const nextCommit = nextCommitFor(m);
  m.state.rngCommit = nextCommit;
  m.state.dice.values = values;
  m.state.version += 1;
  return { values, usedCommit: hmacHex(m.secretHex, msg), rollIndex: m.rollIndex - 1 };
}

io.on('connection', (socket) => {
  socket.emit('connected', { ok: true });

  socket.on('clientPing', (d) => { socket.emit('serverPong', d); });

  socket.on('findQuickMatch', ({ stake }) => {
    const match = createMatch(stake);
    socket.emit('matchFound', { matchId: match.id });
  });

  socket.on('createPrivateMatch', ({ stake }) => {
    const match = createMatch(stake);
    const code = randomId('code').slice(5, 11).toUpperCase();
    inviteCodeToMatch.set(code, match.id);
    socket.emit('privateCreated', { code });
  });

  socket.on('joinPrivateMatch', ({ code }) => {
    const matchId = inviteCodeToMatch.get(code) ?? createMatch().id;
    socket.emit('matchFound', { matchId });
  });

  socket.on('practiceVsAi', () => {
    const match = createMatch(0);
    socket.emit('matchFound', { matchId: match.id });
  });

  socket.on('resume', ({ matchId }) => {
    let m = matches.get(matchId);
    if (!m) m = createMatch(1);
    socket.join(m.id);
    io.to(socket.id).emit('state', m.state);
  });

  socket.on('moveAttempt', ({ from, to }) => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith('m_')) ?? null;
    const match = room ? matches.get(room) : null;
    if (!match) return;

    match.state.currentTurn = match.state.currentTurn === 'white' ? 'black' : 'white';
    match.state.version += 1;

    const { values, usedCommit, rollIndex } = rollDice(match);
    io.to(match.id).emit('diceRolled', { values, rollIndex, commit: usedCommit });
    io.to(match.id).emit('state', match.state);
  });

  socket.on('offerDouble', () => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith('m_')) ?? null;
    const match = room ? matches.get(room) : null;
    if (!match) return;
    const turn = match.state.currentTurn;
    const other: Color = turn === 'white' ? 'black' : 'white';
    match.state.cube.pending = { offeredBy: turn, offeredTo: other };
    match.state.version += 1;
    io.to(match.id).emit('state', match.state);
  });

  socket.on('takeDouble', () => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith('m_')) ?? null;
    const match = room ? matches.get(room) : null;
    if (!match) return;
    if (match.state.cube.pending) {
      match.state.cube.value *= 2;
      match.state.cube.owner = match.state.cube.pending.offeredTo;
      match.state.cube.pending = undefined;
      match.state.version += 1;
      io.to(match.id).emit('state', match.state);
    }
  });

  socket.on('passDouble', () => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith('m_')) ?? null;
    const match = room ? matches.get(room) : null;
    if (!match) return;
    match.state = createMatch(match.stake).state;
    io.to(match.id).emit('state', match.state);
  });
});

fastify.get('/reveal/:matchId', async (req, reply) => {
  const id = (req.params as any).matchId;
  const m = matches.get(id);
  if (!m) return reply.code(404).send({ error: 'not found' });
  return { secretHex: m.secretHex, salt: m.salt, rollIndex: m.rollIndex - 1 };
});

const port = Number(process.env.PORT || 3000);
fastify.listen({ port, host: '0.0.0.0' })
  .then(() => { console.log(`[server] listening on http://localhost:${port}`); })
  .catch((err) => { console.error(err); process.exit(1); });
