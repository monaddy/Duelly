import type { FastifyPluginAsync } from "fastify";

const routes: FastifyPluginAsync = async (app) => {
  app.post("/payments/telegram/webhook", async (req, reply) => {
    const secret = String(req.headers["x-telegram-bot-api-secret-token"] ?? "");
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return reply.code(401).send({ ok: false, error: "bad_secret" });
    }
    const update = req.body as any;
    const key = `tg:${update?.update_id ?? "unknown"}`;
    const existing = await app.prisma.webhookEvent.findUnique({ where: { dedupeKey: key } });
    if (existing) return reply.send({ ok: true, dedup: true });

    await app.prisma.webhookEvent.create({
      data: {
        provider: "telegram",
        eventType: update?.update_type ?? "unknown",
        rawJson: update as any,
        dedupeKey: key,
      },
    });
    app.log.info({ update_id: update?.update_id }, "telegram webhook stored");
    return reply.send({ ok: true });
  });
};
export default routes;
