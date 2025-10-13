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
