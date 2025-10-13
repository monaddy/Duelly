import fp from "fastify-plugin";
import { Redis } from "ioredis";
import { buildRedisUrl } from "../env.js";
export default fp(async (app) => {
  const url = buildRedisUrl();
  const redis = new Redis(url);
  app.decorate("redis", redis);
  app.addHook("onClose", async () => { try { await redis.quit(); } catch {} });
});
