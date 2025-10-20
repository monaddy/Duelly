// DUELLY — RNG Reveal (expects registration with { prefix: '/api/v2' })
import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createHash, createHmac } from 'node:crypto';

const prisma = new PrismaClient();
const hmacSecret = process.env.HMAC_SECRET ?? '';

function toHex(b: Buffer) { return b.toString('hex'); }
function buf(hex: string) { return Buffer.from(hex, 'hex'); }
function eqHex(a?: string|null, b?: string|null) { return !!a && !!b && a.toLowerCase() === b.toLowerCase(); }

function sha256Hex(data: Buffer) { return toHex(createHash('sha256').update(data).digest()); }
function hmac256Hex(key: string, data: Buffer) { return toHex(createHmac('sha256', key).update(data).digest()); }

function rollTwoDiceFromBytes(bytes: Buffer): [number, number] {
  let i = 0; const next = () => { if (i >= bytes.length) { bytes = createHash('sha256').update(bytes).digest(); i = 0; } return bytes[i++]; };
  const nextDie = () => { let b = next(); while (b >= 252) b = next(); return (b % 6) + 1; };
  return [ nextDie(), nextDie() ];
}

function diceFromSeed(seedHex: string, saltHex?: string|null) {
  const seedBuf = buf(seedHex);
  const mix = saltHex ? Buffer.concat([Buffer.from('dice:'), seedBuf, buf(saltHex)]) : Buffer.concat([Buffer.from('dice:'), seedBuf]);
  const bytes = createHash('sha256').update(mix).digest();
  return rollTwoDiceFromBytes(bytes);
}

function diceFromCommit(commitHex: string) {
  const bytes = createHash('sha256').update(buf(commitHex)).digest();
  return rollTwoDiceFromBytes(bytes);
}

const rngRevealRoute: FastifyPluginAsync = async (app) => {
  app.post('/rng/reveal', {
    schema: {
      body: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          serverSeedHex: { type: 'string', pattern: '^[0-9a-fA-F]+$' }
        },
        required: ['id'],
        additionalProperties: false
      }
    }
  }, async (req, reply) => {
    const { id, serverSeedHex } = (req.body as any);
    const c = await prisma.rngCommit.findUnique({ where: { id } });
    if (!c) return reply.code(404).send({ ok:false, error:'NOT_FOUND', message:'RngCommit not found' });

    const commitHex = (c as any).serverCommitHex as string | undefined;
    const saltHex = (c as any).clientSaltHex as (string|undefined);
    let seedHex: string | undefined = serverSeedHex || (c as any).serverSeedHex || undefined;

    // אם אין seed בבקשה וב-DB – fallback: חשיפה ללא seed (dice לפי commit), 200 כדי לשמור על זרימה
    if (!seedHex) {
      const dice = commitHex ? diceFromCommit(commitHex) : [1,1];
      if (!(c as any).revealed) { await prisma.rngCommit.update({ where: { id }, data: { revealed: true } }); }
      return reply.code(200).send({
        id: (c as any).id, matchId: (c as any).matchId,
        serverCommitHex: commitHex, revealed: true, serverSeedHex: null, dice, fallback: 'no_server_seed'
      });
    }

    const seedBuf = buf(seedHex);
    const candidates: string[] = [];
    // SHA256(seed)
    candidates.push(sha256Hex(seedBuf));
    // HMAC(seed)
    candidates.push(hmac256Hex(hmacSecret, seedBuf));
    // HMAC(seed || seed+salt)
    if (saltHex) candidates.push(hmac256Hex(hmacSecret, Buffer.concat([seedBuf, buf(saltHex)])));

    const match = candidates.find(x => eqHex(x, commitHex));
    if (!match) {
      return reply.code(400).send({ ok:false, error:'COMMIT_MISMATCH', message:'serverSeedHex does not match serverCommitHex' });
    }

    // עדכון revealed ושמירת seed אם חסר
    if (!(c as any).revealed || !(c as any).serverSeedHex) {
      await prisma.rngCommit.update({ where: { id }, data: { revealed: true, serverSeedHex: seedHex } });
    }

    const dice = diceFromSeed(seedHex, saltHex ?? null);
    return {
      id: (c as any).id, matchId: (c as any).matchId,
      serverCommitHex: commitHex, revealed: true, serverSeedHex: seedHex, dice
    };
  });
};

export default rngRevealRoute;
