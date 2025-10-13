// Fastify + Socket.io + Prisma + Telegram initData verify + commit–reveal + pino logger + AGE/GEO flags
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { Server as IOServer } from 'socket.io';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import pino from 'pino';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const PORT = parseInt(process.env.API_PORT || '3000', 10);
const HOST = process.env.API_HOST || '0.0.0.0';
const HMAC_SECRET = process.env.HMAC_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const REDIS_URL = process.env.REDIS_URL || '';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const AGE_GATE = (process.env.AGE_GATE || 'false').toLowerCase() === 'true';
const GEO_BLOCK_LIST = (process.env.GEO_BLOCK_LIST || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

const prisma = new PrismaClient();
const logger = pino({ level: LOG_LEVEL });
const app = Fastify({
  logger,
  trustProxy: true,
  genReqId: () => crypto.randomUUID(),
});

// Global API RL (edge RL קיים)
await app.register(rateLimit, { global: false, max: 60, timeWindow: '1 minute' });

// CORS fallback (edge מטפל עיקרי)
app.addHook('onRequest', async (req, reply) => {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))) {
    reply.header('access-control-allow-origin', origin);
    reply.header('access-control-allow-credentials', 'true');
  }
});

// Geo/Age gate placeholder hook (ניתן לחזק לפי דרישת Compliance)
app.addHook('preHandler', async (req, reply) => {
  // כאן ניתן לשלב IP → מדינה + מטלגרם user_locale (אם זמין בפלואו שלך)
  if (GEO_BLOCK_LIST.length) {
    // דוגמה: שימוש בכותרת X-Country-Code אם קיים ע"י פרוקסי חיצוני/WAF
    const cc = (req.headers['x-country-code'] || '').toString().toUpperCase();
    if (cc && GEO_BLOCK_LIST.includes(cc)) {
      return reply.code(451).send({ ok: false, error: 'GEO_BLOCKED' });
    }
  }
  if (AGE_GATE) {
    // דרוש אימות גיל במסלולים רגישים; להשלים בהתאם לדרישות.
  }
});

// Health
app.get('/api/health', async () => ({ ok: true, ts: Date.now() }));
app.get('/api/health/db', async () => {
  const now = await prisma.$queryRaw`SELECT NOW()`;
  return { ok: true, now };
});

// Telegram initData verification
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

// Unbiased dice helpers
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

// Zod schemas
const AuthTelegramSchema = z.object({ initData: z.string().min(10) });
const MatchCreateSchema  = z.object({
  p1Id: z.string().uuid().optional(),
  p2Id: z.string().uuid().optional(),
  entryCents: z.number().int().min(1).max(10_000).optional().default(50),
  currency: z.string().min(3).max(6).optional().default('USD'),
});
const RngCommitSchema    = z.object({ matchId: z.string().uuid(), clientSaltHex: z.string().regex(/^[0-9a-f]*$/i).optional() });
const RngRevealSchema    = z.object({ rngCommitId: z.string().uuid() });

// Routes
app.post('/api/auth/telegram', async (req, reply) => {
  const parsed = AuthTelegramSchema.safeParse(req.body || {});
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'BAD_PAYLOAD', details: parsed.error.flatten() });
  const v = verifyTelegramInitData(parsed.data.initData);
  if (!v.ok) return reply.code(401).send({ ok: false, error: v.error });

  const tg = v.user || {}; const tgId = String(tg.id);
  const user = await prisma.user.upsert({
    where: { tgId },
    update: { username: tg.username ?? null, firstName: tg.first_name ?? null, lastName: tg.last_name ?? null },
    create: { tgId, username: tg.username ?? null, firstName: tg.first_name ?? null, lastName: tg.last_name ?? null }
  });
  const token = crypto.createHmac('sha256', JWT_SECRET || 'dev').update(JSON.stringify({ uid: user.id, tgId })).digest('hex');
  return { ok: true, user: { id: user.id, tgId }, token };
});

app.post('/api/match/create', async (req, reply) => {
  const parsed = MatchCreateSchema.safeParse(req.body || {});
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'BAD_PAYLOAD', details: parsed.error.flatten() });
  const { p1Id, p2Id, entryCents, currency } = parsed.data;
  const match = await prisma.match.create({ data: { status: 'created', p1Id: p1Id ?? null, p2Id: p2Id ?? null, entryCents, currency } });
  return { ok: true, matchId: match.id };
});

app.post('/api/rng/commit', async (req, reply) => {
  const parsed = RngCommitSchema.safeParse(req.body || {});
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'BAD_PAYLOAD', details: parsed.error.flatten() });
  const { matchId, clientSaltHex } = parsed.data;
  const serverSeedHex = crypto.randomBytes(32).toString('hex');
  const serverCommitHex = crypto.createHmac('sha256', HMAC_SECRET).update(serverSeedHex).digest('hex');
  const rc = await prisma.rngCommit.create({ data: { matchId, serverCommitHex, serverSeedHex, clientSaltHex: clientSaltHex ?? null, revealed: false } });
  return { ok: true, id: rc.id, serverCommitHex };
});

app.post('/api/rng/reveal', async (req, reply) => {
  const parsed = RngRevealSchema.safeParse(req.body || {});
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'BAD_PAYLOAD', details: parsed.error.flatten() });
  const rc = await prisma.rngCommit.findUnique({ where: { id: parsed.data.rngCommitId } });
  if (!rc) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' });
  if (rc.revealed !== false) return reply.code(400).send({ ok: false, error: 'ALREADY_REVEALED' });
  const check = crypto.createHmac('sha256', HMAC_SECRET).update(rc.serverSeedHex || '').digest('hex');
  if (check !== rc.serverCommitHex) return reply.code(409).send({ ok: false, error: 'COMMIT_MISMATCH' });
  const dice = rollDiceFromSeed(rc.serverSeedHex || '');
  await prisma.rngCommit.update({ where: { id: rc.id }, data: { revealed: true } });
  return { ok: true, serverSeedHex: rc.serverSeedHex, serverCommitHex: rc.serverCommitHex, dice };
});

// Payments webhook with per-route rateLimit
app.route({
  method: 'POST',
  url: '/api/payments/telegram/webhook',
  config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  handler: async (req, reply) => {
    const payload = req.body || {};
    const dedupeKey = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    try {
      await prisma.webhookEvent.create({ data: { provider: 'telegram', eventType: 'payment', rawJson: payload, handled: false, dedupeKey } });
    } catch {
      return reply.code(409).send({ ok: true, duplicate: true });
    }
    return { ok: true };
  }
});

// Socket.io + optional Redis adapter
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
if (REDIS_URL) {
  const pub = new Redis(REDIS_URL), sub = new Redis(REDIS_URL);
  io.adapter(createAdapter(pub, sub));
  app.log.info('Socket.io using Redis adapter');
}
io.on('connection', (socket) => {
  app.log.info({ sid: socket.id }, 'socket connected');
  socket.emit('hello', { t: Date.now() });
  socket.on('lobby:join', (room) => { socket.join(room); socket.emit('lobby:joined', { room }); });
  socket.on('disconnect', (reason) => app.log.info({ sid: socket.id, reason }, 'socket disconnected'));
});

const start = async () => {
  try { await app.listen({ port: PORT, host: HOST }); app.log.info(`API listening on ${HOST}:${PORT}`); }
  catch (err) { app.log.error(err); process.exit(1); }
};
start();
