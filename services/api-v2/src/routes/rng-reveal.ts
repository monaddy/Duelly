// DUELLY — RNG Reveal (accepts serverSeedHex optionally; expects { prefix: '/api/v2' } registration)
import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();

function sha256Hex(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

// rejection sampling לגלגול קוביות מתוך בלוק ביטים דטרמיניסטי
function rollTwoDiceFromSeed(seedHex: string): [number, number] {
  let block = createHash('sha256').update(Buffer.from(seedHex, 'hex')).digest();
  let i = 0;
  const nextByte = () => {
    if (i >= block.length) { block = createHash('sha256').update(block).digest(); i = 0; }
    return block[i++];
  };
  const nextDie = () => {
    let b = nextByte();
    while (b >= 252) b = nextByte(); // 252..255 נדחים כדי לבטל bias
    return (b % 6) + 1;
  };
  return [nextDie(), nextDie()];
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
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            matchId: { type: 'string', format: 'uuid' },
            serverCommitHex: { type: 'string' },
            revealed: { type: 'boolean' },
            serverSeedHex: { type: 'string' },
            dice: {
              type: 'array',
              items: { type: 'integer', minimum: 1, maximum: 6 },
              minItems: 2, maxItems: 2
            }
          },
          required: ['id','matchId','serverCommitHex','revealed','serverSeedHex','dice']
        },
        400: {
          type: 'object',
          properties: { ok:{type:'boolean'}, error:{type:'string'}, message:{type:'string'} },
          required: ['ok','error','message']
        },
        404: {
          type: 'object',
          properties: { ok:{type:'boolean'}, error:{type:'string'}, message:{type:'string'} },
          required: ['ok','error','message']
        }
      }
    }
  }, async (req, reply) => {
    const { id, serverSeedHex } = (req.body as any);
    const c = await prisma.rngCommit.findUnique({ where: { id } });
    if (!c) return reply.code(404).send({ ok:false, error:'NOT_FOUND', message:'RngCommit not found' });

    // קביעת ה-seed: מה-body אם סופק; אחרת מה-DB אם קיים
    const seedHex = (serverSeedHex && String(serverSeedHex)) || (c as any).serverSeedHex;
    if (!seedHex) return reply.code(400).send({ ok:false, error:'SERVER_SEED_REQUIRED', message:'serverSeedHex is required (body or DB)' });

    const expected = (c as any).serverCommitHex?.toLowerCase();
    const actual = sha256Hex(Buffer.from(seedHex, 'hex')).toLowerCase();
    if (expected && actual !== expected) {
      return reply.code(400).send({ ok:false, error:'COMMIT_MISMATCH', message:'serverSeedHex does not match serverCommitHex' });
    }

    // עדכון revealed + שמירת seed אם חסר
    if (!(c as any).revealed || !(c as any).serverSeedHex) {
      await prisma.rngCommit.update({ where: { id }, data: { revealed: true, serverSeedHex: seedHex } });
    }

    const dice = rollTwoDiceFromSeed(seedHex);
    return {
      id: (c as any).id,
      matchId: (c as any).matchId,
      serverCommitHex: (c as any).serverCommitHex,
      revealed: true,
      serverSeedHex: seedHex,
      dice
    };
  });
};

export default rngRevealRoute;
