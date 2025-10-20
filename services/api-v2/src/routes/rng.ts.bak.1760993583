import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";
import { z } from "zod";

const CommitBody = z.object({ matchId: z.string().uuid() });
const RevealBody = z.object({
  id: z.string().uuid(),
  serverSeedHex: z.string().regex(/^[0-9a-f]{64}$/i),
  clientSaltHex: z.string().default("").optional(),
});

const sha256hexHex = (hex: string) =>
  crypto.createHash("sha256").update(Buffer.from(hex, "hex")).digest("hex");

const hmacSha256 = (keyHex: string, msg: string) =>
  crypto.createHmac("sha256", Buffer.from(keyHex, "hex")).update(msg).digest();

function toDice(buf: Buffer): [number, number] {
  const out: number[] = [];
  for (let i = 0; i < buf.length && out.length < 2; i++) {
    const b = buf[i];
    if (b < 252) out.push((b % 6) + 1); // rejection sampling (0..251)
  }
  if (out.length < 2) return toDice(crypto.createHash("sha256").update(buf).digest());
  return [out[0], out[1]];
}

const rngRoutes: FastifyPluginAsync = async (app) => {
  app.post("/rng/commit", async (req, reply) => {
    const { matchId } = CommitBody.parse(req.body ?? {});
    // וידוא שמאץ' קיים
    await app.prisma.match.findUniqueOrThrow({ where: { id: matchId } });

    const id = crypto.randomUUID(); // commitId נפרד מה-matchId
    const serverSeedHex = crypto.randomBytes(32).toString("hex");
    const serverCommitHex = sha256hexHex(serverSeedHex);

    await app.prisma.rngCommit.create({
      data: { id, matchId, serverCommitHex, serverSeedHex },
    });

    return reply.send({ id, serverCommitHex });
  });

  app.post("/rng/reveal", async (req, reply) => {
    const { id, serverSeedHex, clientSaltHex } = RevealBody.parse(req.body ?? {});
    const commit = await app.prisma.rngCommit.findUnique({ where: { id } });
    if (!commit) return reply.code(404).send({ error: "commit_not_found" });
    if (sha256hexHex(serverSeedHex) !== commit.serverCommitHex)
    if (commit.revealed) return reply.code(409).send({ error: "already_revealed" });
      return reply.code(400).send({ error: "commit_mismatch" });

    const digest = hmacSha256(serverSeedHex, clientSaltHex ?? "");
    const dice = toDice(digest);

    await app.prisma.rngCommit.update({
      where: { id },
      data: { serverSeedHex, clientSaltHex: clientSaltHex ?? "", revealed: true },
    });

    return reply.send({ ok: true, id, dice });
  });
};

export default rngRoutes;
