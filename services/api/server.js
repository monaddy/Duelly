// Fastify + Socket.io + Prisma + Telegram initData verify + commit–reveal (bootstrap)

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { Server as IOServer } from 'socket.io';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const PORT = parseInt(process.env.API_PORT || '3000', 10);
const HOST = process.env.API_HOST || '0.0.0.0';
const HMAC_SECRET = process.env.HMAC_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

const prisma = new PrismaClient();

const app = Fastify({ logger: true, trustProxy: true });

await app.register(rateLimit, { global: false, max: 60, timeWindow: '1 minute' });

// CORS fallback (edge handles most)
app.addHook('onRequest', async (req, reply) => {
  const origin = req.headers.origin;
  if (!origin) return;
  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
    reply.header('access-control-allow-origin', origin);
    reply.header('access-control-allow-credentials', 'true');
  }
});

// Health
app.get('/api/health', async () => ({ ok: true, ts: Date.now() }));
app.get('/api/version', async () => ({ name: 'Backgammon API', version: '0.2.0', env: process.env.NODE_ENV || 'development' }));

// --- Telegram initData verification ---
function verifyTelegramInitData(initData) {
  if (!TELEGRAM_BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN_NOT_SET' };
  const params = new URLSearchParams(initData);
  const hash = params.get('hash') || '';
  params.delete('hash');
  const pairs = [];
  for (const [k, v] of params.entries()) pairs.push(`${k}=${v}`);
  pairs.sort();
  const dataCheck = pairs.join('\n');
  const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
  const calc = crypto.createHmac('sha256', secretKey).update(dataCheck).digest('hex');
  if (calc !== hash) return { ok: false, error: 'BAD_HASH' };

  let user = null;
  const userStr = params.get('user');
  if (userStr) { try { user = JSON.parse(userStr); } catch {} }
  return { ok: true, user };
}

// --- RNG helpers (rejection sampling avoids modulo bias) ---
function unbiasedDie(u32) {
  const limit = 0xFFFFFFFF - (0xFFFFFFFF % 6);
  while (true) {
    if (u32 <= limit) return (u32 % 6) + 1;
    u32 = crypto.randomBytes(4).readUInt32BE(0);
  }
}
function rollDiceFromSeed(seedHex) {
  const bytes = crypto.createHash('sha256').update(Buffer.from(seedHex, 'hex')).digest();
  const a = bytes.readUInt32BE(0);
  const b = bytes.readUInt32BE(4);
  return [unbiasedDie(a), unbiasedDie(b)];
}

// --- Auth: Telegram initData -> upsert user ---
app.post('/api/auth/telegram', async (req, reply) => {
  const { initData } = req.body || {};
  if (!initData) return reply.code(400).send({ ok: false, error: 'INITDATA_REQUIRED' });

  const v = verifyTelegramInitData(initData);
  if (!v.ok) return reply.code(401).send({ ok: false, error: v.error });

  const tg = v.user || {};
  const tgId = String(tg.id);
  const user = await prisma.user.upsert({
    where: { tgId },
    update: { username: tg.username ?? null, firstName: tg.first_name ?? null, lastName: tg.last_name ?? null },
    create: { tgId, username: tg.username ?? null, firstName: tg.first_name ?? null, lastName: tg.last_name ?? null }
  });

  // placeholder token (אם תרצה JWT אמיתי נוסיף בהמשך)
  const token = crypto.createHmac('sha256', JWT_SECRET || 'dev').update(JSON.stringify({ uid: user.id, tgId })).digest('hex');
  return { ok: true, user: { id: user.id, tgId }, token };
});

// --- Match create (skeleton) ---
app.post('/api/match/create', async (req, reply) => {
  const { p1Id, p2Id, entryCents = 50, currency = 'USD' } = req.body || {};
  const match = await prisma.match.create({ data: { status: 'created', p1Id: p1Id ?? null, p2Id: p2Id ?? null, entryCents, currency } });
  return { ok: true, matchId: match.id };
});

// --- RNG commit ---
app.post('/api/rng/commit', async (req, reply) => {
  const { matchId, clientSaltHex } = req.body || {};
  if (!matchId) return reply.code(400).send({ ok: false, error: 'MATCH_ID_REQUIRED' });
  const serverSeedHex = crypto.randomBytes(32).toString('hex');
  const serverCommitHex = crypto.createHmac('sha256', HMAC_SECRET).update(serverSeedHex).digest('hex');
  const rc = await prisma.rngCommit.create({ data: { matchId, serverCommitHex, serverSeedHex, clientSaltHex: clientSaltHex ?? null, revealed: false } });
  return { ok: true, id: rc.id, serverCommitHex };
});

// --- RNG reveal ---
app.post('/api/rng/reveal', async (req, reply) => {
  const { rngCommitId } = req.body || {};
  if (!rngCommitId) return reply.code(400).send({ ok: false, error: 'RNG_COMMIT_ID_REQUIRED' });
  const rc = await prisma.rngCommit.findUnique({ where: { id: rngCommitId } });
  if (!rc) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' });
  if (rc.revealed !== false) return reply.code(400).send({ ok: false, error: 'ALREADY_REVEALED' });

  const check = crypto.createHmac('sha256', HMAC_SECRET).update(rc.serverSeedHex || '').digest('hex');
  if (check !== rc.serverCommitHex) return reply.code(409).send({ ok: false, error: 'COMMIT_MISMATCH' });

  const dice = rollDiceFromSeed(rc.serverSeedHex || '');
  await prisma.rngCommit.update({ where: { id: rc.id }, data: { revealed: true } });
  return { ok: true, serverSeedHex: rc.serverSeedHex, serverCommitHex: rc.serverCommitHex, dice };
});

// --- Payments webhook skeleton ---
app.post('/api/payments/telegram/webhook', async (req, reply) => {
  const payload = req.body || {};
  const dedupeKey = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  try {
    await prisma.webhookEvent.create({ data: { provider: 'telegram', eventType: 'payment', rawJson: payload, handled: false, dedupeKey } });
  } catch {}
  return { ok: true };
});

// --- Socket.io ---
const io = new IOServer(app.server, {
  path: '/socket.io',
  serveClient: false,
  cors: {
    origin: (origin, cb) => {
      if (ALLOWED_ORIGINS.length === 0 || !origin) return cb(null, true);
      return cb(null, ALLOWED_ORIGINS.includes(origin));
    },
    methods: ['GET', 'POST'],
  },
});
io.on('connection', (socket) => {
  app.log.info(`Socket connected: ${socket.id}`);
  socket.emit('hello', { t: Date.now() });
  socket.on('lobby:join', (room) => { socket.join(room); socket.emit('lobby:joined', { room }); });
  socket.on('disconnect', (reason) => app.log.info(`Socket ${socket.id} disconnected: ${reason}`));
});

// --- start ---
const start = async () => {
  try { await app.listen({ port: PORT, host: HOST }); app.log.info(`API listening on ${HOST}:${PORT}`); }
  catch (err) { app.log.error(err); process.exit(1); }
};
start();
