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
