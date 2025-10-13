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
