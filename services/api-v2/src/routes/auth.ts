import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/telegram", async (req, reply) => {
    const initData = String((req.body as any)?.initData ?? "");
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    if (!initData || !botToken) return reply.code(400).send({ error: "missing_params" });

    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return reply.code(400).send({ error: "missing_hash" });
    params.delete("hash");

    const dataCheck = [...params.entries()]
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([k,v]) => `${k}=${v}`).join("\n");

    const secret = crypto.createHash("sha256").update(botToken).digest();
    const hmac = crypto.createHmac("sha256", secret).update(dataCheck).digest("hex");
    if (hmac !== hash) return reply.code(401).send({ error: "invalid_initData" });

    const userJson = JSON.parse(params.get("user") ?? "{}");
    const tgId = BigInt(userJson.id);
    const username = userJson.username ?? null;
    const firstName = userJson.first_name ?? null;
    const lastName  = userJson.last_name  ?? null;

    const user = await app.prisma.user.upsert({
      where: { telegramId: tgId },
      update: { username, firstName, lastName },
      create: { telegramId: tgId, username, firstName, lastName },
    });

    const token = jwt.sign(
      { sub: user.id, tg: String(user.telegramId), username: user.username ?? undefined },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );
    return reply.send({ token });
  });
};
export default authRoutes;
