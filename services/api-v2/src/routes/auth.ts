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
