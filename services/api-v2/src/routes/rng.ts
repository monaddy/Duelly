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
