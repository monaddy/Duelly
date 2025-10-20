// DUELLY — Security middleware (ESM, Fastify v4) with soft-enforcement flags (TS-safe)
import type { FastifyPluginAsync } from 'fastify';
import { createHmac, timingSafeEqual } from 'node:crypto';

// --- helpers ---
function toStr(x: unknown): string { return typeof x === 'string' ? x : (x == null ? '' : String(x)); }

// capture raw body for HMAC (safe fallback to JSON.stringify if not present)
function getRaw(req: any): string {
  if (typeof req.rawBody === 'string') return req.rawBody;
  if (typeof req.body === 'string') return req.body;
  try { return JSON.stringify(req.body ?? {}); } catch { return ''; }
}

function verifyHmac(hmacSecret: string, body: string, headerSig?: string): boolean {
  const sig = toStr(headerSig);
  if (!hmacSecret || !sig) return false;
  const calc = createHmac('sha256', hmacSecret).update(body).digest('hex');
  try {
    const a = Buffer.from(calc, 'hex');
    const b = Buffer.from(sig, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

// minimal HS256 verification (base64url)
function b64urlDecode(s: string): string {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function verifyJwtHs256(token: string, secret: string): { ok:boolean; payload?:any } {
  try {
    const parts = token.split('.'); if (parts.length !== 3) return {ok:false};
    const [h, p, s] = parts;
    const data = `${h}.${p}`;
    const expected = createHmac('sha256', secret).update(data).digest();
    const sig = Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (expected.length !== sig.length || !timingSafeEqual(expected, sig)) return {ok:false};
    const payload = JSON.parse(b64urlDecode(p));
    const now = Math.floor(Date.now()/1000);
    if ((payload.exp && now > payload.exp) || (payload.nbf && now < payload.nbf)) return {ok:false};
    return {ok:true, payload};
  } catch { return {ok:false}; }
}

// --- guards ---
export const jwtGuard: FastifyPluginAsync = async (app) => {
  const JWT_SECRET = toStr(process.env.JWT_SECRET);
  const ENF = toStr(process.env.SEC_ENFORCE_JWT).toLowerCase() === 'true';
  if (!JWT_SECRET) { app.log.warn('jwtGuard: JWT_SECRET missing — NO-OP'); return; }
  app.addHook('onRequest', async (req, reply) => {
    const auth = toStr((req.headers as any).authorization);
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) { if (ENF) return reply.code(401).send({ ok:false, error:'NO_BEARER' }); else return; }
    const v = verifyJwtHs256(m[1], JWT_SECRET);
    if (!v.ok && ENF) return reply.code(401).send({ ok:false, error:'BAD_JWT' });
    (req as any).user = v.payload;
  });
};

export const hmacGuard: FastifyPluginAsync = async (app) => {
  const HMAC_SECRET = toStr(process.env.HMAC_SECRET);
  const ENF = toStr(process.env.SEC_ENFORCE_HMAC).toLowerCase() === 'true';
  if (!HMAC_SECRET) { app.log.warn('hmacGuard: HMAC_SECRET missing — NO-OP'); return; }

  // keep body as string to avoid TS ambiguity, attach rawBody
  app.addContentTypeParser('*', { parseAs: 'string' }, (req, body: string, done) => {
    (req as any).rawBody = body; done(null, body);
  });

  app.addHook('onRequest', async (req, reply) => {
    const method = toStr(req.method).toUpperCase();
    if (!['POST','PUT','PATCH'].includes(method)) return;
    const url = toStr((req as any).url);
    const sensitive = url.startsWith('/api/v2/rng/commit') || url.includes('/moves');
    if (!sensitive) return;

    const raw = getRaw(req);
    const sig = toStr((req.headers as any)['x-signature']);
    const ok = verifyHmac(HMAC_SECRET, raw, sig);
    if (!ok && ENF) return reply.code(401).send({ ok:false, error:'BAD_HMAC' });
  });
};
