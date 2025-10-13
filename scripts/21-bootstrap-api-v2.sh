#!/usr/bin/env bash
set -euo pipefail
ROOT="/root/backgammon-mini-app"
SRV="$ROOT/services/api-v2"
mkdir -p "$SRV/src/routes" "$SRV/src/plugins" "$SRV/src/utils" "$SRV/src/fairness"

# package.json (ESM)
cat > "$SRV/package.json" <<'JSON'
{
  "name": "backgammon-api-v2",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "TS_NODE_PROJECT=tsconfig.json ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^12.4.0",
    "@fastify/jwt": "^9.0.3",
    "@fastify/rate-limit": "^10.1.0",
    "@socket.io/redis-adapter": "^8.3.0",
    "dotenv": "^16.4.5",
    "fastify": "^4.28.1",
    "ioredis": "^5.4.1",
    "socket.io": "^4.7.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.9",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.6.2"
  }
}
JSON

# tsconfig (NodeNext ESM)
cat > "$SRV/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
JSON

# Dockerfile (פורט 3000)
cat > "$SRV/Dockerfile" <<'DOCKER'
FROM node:20-bullseye AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-bullseye
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000
CMD ["node","dist/index.js"]
DOCKER

# --- קבצי קוד ---

# env helper
cat > "$SRV/src/env.ts" <<'TS'
import { z } from "zod";
const EnvSchema = z.object({
  NODE_ENV: z.string().default("production"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default("info"),
  APP_BASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),

  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("redis"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_PAYMENT_PROVIDER_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional()
});
export const env = EnvSchema.parse(process.env);
export function buildRedisUrl(): string {
  if (env.REDIS_URL && env.REDIS_URL.length > 0) return env.REDIS_URL;
  const auth = env.REDIS_PASSWORD ? `:${env.REDIS_PASSWORD}@` : "";
  return `redis://${auth}${env.REDIS_HOST}:${env.REDIS_PORT}/0`;
}
TS

# Redis plugin
cat > "$SRV/src/plugins/redis.ts" <<'TS'
import fp from "fastify-plugin";
import { Redis } from "ioredis";
import { buildRedisUrl } from "../env.js";
export default fp(async (app) => {
  const url = buildRedisUrl();
  const redis = new Redis(url);
  app.decorate("redis", redis);
  app.addHook("onClose", async () => { try { await redis.quit(); } catch {} });
});
TS

# Socket.IO + Redis adapter (path=/socket.io-v2)
cat > "$SRV/src/plugins/socket.ts" <<'TS'
import fp from "fastify-plugin";
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { buildRedisUrl } from "../env.js";

export default fp(async (app) => {
  const io = new Server((app.server as HttpServer), {
    path: "/socket.io-v2",
    cors: { origin: true, credentials: true },
  });

  const url = buildRedisUrl();
  const pub = new Redis(url);
  const sub = pub.duplicate();
  io.adapter(createAdapter(pub, sub));

  app.decorate("io", io);
  app.addHook("onClose", async () => {
    await new Promise<void>((res) => io.close(() => res()));
    try { await pub.quit(); await sub.quit(); } catch {}
  });

  io.of("/").on("connection", (socket) => {
    socket.on("ping", () => socket.emit("pong", { t: Date.now() }));
  });
});
TS

# utils: telegram auth
cat > "$SRV/src/utils/telegram-auth.ts" <<'TS'
import crypto from "node:crypto";
export function validateTelegramInitData(initData: string, botToken: string): {
  ok: boolean; data?: Record<string, string>;
} {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false };
  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => `${k}=${v}`).join("\n");
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (hmac !== hash) return { ok: false };
  const data: Record<string,string> = {};
  params.forEach((v,k)=>data[k]=v);
  return { ok: true, data };
}
TS

# fairness rng
cat > "$SRV/src/fairness/rng.ts" <<'TS'
import crypto from "node:crypto";
export function sha256hex(input: Buffer | string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
export function hmacSha256(key: Buffer | string, msg: Buffer | string) {
  return crypto.createHmac("sha256", key).update(msg).digest();
}
function byteToDie(b: number): number | null { if (b > 251) return null; return (b % 6) + 1; }
export function digestToDice(d: Buffer): [number, number] {
  let i=0, d1:null|number=null, d2:null|number=null;
  while (i<d.length && (d1===null || d2===null)) {
    const v = d[i++], die = byteToDie(v);
    if (die!==null) { if (d1===null) d1=die; else if (d2===null) d2=die; }
  }
  if (d1===null || d2===null) {
    const rehash = crypto.createHash("sha256").update(d).digest();
    return digestToDice(rehash);
  }
  return [d1, d2];
}
TS

# routes: system
cat > "$SRV/src/routes/system.ts" <<'TS'
import type { FastifyPluginAsync } from "fastify";
const systemRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({ ok: true }));
  app.get("/version", async () => ({ name: "backgammon-api-v2", version: "0.1.0" }));
  app.get("/health/db", async () => {
    const pong = await app.redis.ping();
    return { redis: pong === "PONG" };
  });
};
export default systemRoutes;
TS

# routes: rng (commit-reveal via redis)
cat > "$SRV/src/routes/rng.ts" <<'TS'
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { sha256hex, hmacSha256, digestToDice } from "../fairness/rng.js";

const CommitBody = z.object({ matchId: z.string().uuid().optional() });
const RevealBody = z.object({
  id: z.string(),
  serverSeed: z.string().regex(/^[0-9a-fA-F]{64}$/),
  clientSeeds: z.array(z.string()).default([]),
});

const rngRoutes: FastifyPluginAsync = async (app) => {
  app.post("/rng/commit", async (req, reply) => {
    const { matchId } = CommitBody.parse(req.body ?? {});
    const id = matchId ?? crypto.randomUUID();
    const serverSeed = crypto.randomBytes(32).toString("hex");
    const commit = sha256hex(Buffer.from(serverSeed, "hex"));
    await app.redis.hset(`rng:${id}`, { serverSeed, commit });
    await app.redis.expire(`rng:${id}`, 24 * 3600);
    return reply.send({ id, serverCommit: commit });
  });

  app.post("/rng/reveal", async (req, reply) => {
    const { id, serverSeed, clientSeeds } = RevealBody.parse(req.body ?? {});
    const savedCommit = await app.redis.hget(`rng:${id}`, "commit");
    if (!savedCommit) return reply.code(404).send({ error: "commit not found" });
    if (sha256hex(Buffer.from(serverSeed, "hex")) !== savedCommit) {
      return reply.code(400).send({ error: "commit mismatch" });
    }
    const digest = hmacSha256(Buffer.from(serverSeed, "hex"), `${id}|${clientSeeds.join("|")}`);
    const dice = digestToDice(digest);
    await app.redis.hset(`rng:${id}`, { revealed: "1" });
    return reply.send({ ok: true, id, dice, serverSeed, serverCommit: savedCommit });
  });
};
export default rngRoutes;
TS

# routes: auth (Telegram initData -> JWT)
cat > "$SRV/src/routes/auth.ts" <<'TS'
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { validateTelegramInitData } from "../utils/telegram-auth.js";
const Body = z.object({ initData: z.string().min(1) });
const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/telegram", async (req, reply) => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues });
    const { ok, data } = validateTelegramInitData(parsed.data.initData, process.env.TELEGRAM_BOT_TOKEN!);
    if (!ok || !data) return reply.code(401).send({ error: "Invalid initData" });
    const tgUser = JSON.parse(data.user ?? "{}");
    const token = app.jwt.sign(
      { sub: String(tgUser.id), tg: String(tgUser.id), username: tgUser.username },
      { expiresIn: "30d" }
    );
    return reply.send({ token });
  });
};
export default authRoutes;
TS

# routes: payments webhook (idempotent via redis + secret_token)
cat > "$SRV/src/routes/payments.ts" <<'TS'
import type { FastifyPluginAsync } from "fastify";
const paymentsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payments/telegram/webhook", async (req, reply) => {
    const secretHeader = (req.headers["x-telegram-bot-api-secret-token"] as string | undefined) ?? "";
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
    if (expected && secretHeader !== expected) {
      return reply.code(401).send({ ok: false, error: "bad secret" });
    }
    const update = req.body as any;
    const key = `idem:tg:${update?.update_id ?? "unknown"}`;
    const ok = await app.redis.set(key, "1", "EX", 86400, "NX");
    if (ok !== "OK") return reply.send({ ok: true, dedup: true });
    await app.redis.lpush("queue:webhooks:telegram", JSON.stringify(update));
    app.log.info({ update_id: update?.update_id }, "telegram webhook accepted");
    return reply.send({ ok: true });
  });
};
export default paymentsRoutes;
TS

# index.ts (Fastify app with /api/v2 prefix and socket plugin)
cat > "$SRV/src/index.ts" <<'TS'
import "dotenv/config";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyJwt from "@fastify/jwt";
import { env } from "./env.js";
import redisPlugin from "./plugins/redis.js";
import socketPlugin from "./plugins/socket.js";
import systemRoutes from "./routes/system.js";
import authRoutes from "./routes/auth.js";
import paymentsRoutes from "./routes/payments.js";
import rngRoutes from "./routes/rng.js";

const app = Fastify({ logger: { level: env.LOG_LEVEL } });
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, { origin: true, credentials: true });
await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! });
await app.register(redisPlugin);
await app.register(socketPlugin);

await app.register(systemRoutes, { prefix: "/api/v2" });
await app.register(authRoutes, { prefix: "/api/v2" });
await app.register(paymentsRoutes, { prefix: "/api/v2" });
await app.register(rngRoutes, { prefix: "/api/v2" });

await app.listen({ port: env.PORT, host: env.HOST });
app.log.info(`API V2 listening at ${env.HOST}:${env.PORT} (prefix=/api/v2, ws=/socket.io-v2)`);
TS

echo "✅ נוצר קוד API-V2 ב: $SRV"
