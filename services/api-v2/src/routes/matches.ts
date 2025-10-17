import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const CreateBody = z.object({
  playerAId: z.string().uuid().optional(),
  playerBId: z.string().uuid().optional(),
});

const matchesRoutes: FastifyPluginAsync = async (app) => {
  // יצירת משחק: אם לא סופקו שחקנים → נשתמש בזוג seed (1001/1002) או ניצור אותם
  app.post("/matches", async (req, reply) => {
    const { playerAId, playerBId } = CreateBody.parse(req.body ?? {});

    let aId = playerAId;
    let bId = playerBId;

    if (!aId || !bId) {
      const [a, b] = await Promise.all([
        app.prisma.user.upsert({
          where: { telegramId: BigInt(1001) },
          create: { telegramId: BigInt(1001), username: "seedA" },
          update: {},
        }),
        app.prisma.user.upsert({
          where: { telegramId: BigInt(1002) },
          create: { telegramId: BigInt(1002), username: "seedB" },
          update: {},
        }),
      ]);
      aId = aId ?? a.id;
      bId = bId ?? b.id;
    }

    const match = await app.prisma.match.create({
      data: { status: "ACTIVE", playerAId: aId!, playerBId: bId! },
      select: { id: true, status: true },
    });

    return reply.send(match);
  });

  // שליפה לפי מזהה
  app.get("/matches/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "bad_id" });

    const match = await app.prisma.match.findUnique({
      where: { id },
      select: {
        id: true, status: true, createdAt: true, updatedAt: true,
        playerAId: true, playerBId: true, turn: true, cubeOwner: true, cubeValue: true, boardJson: true,
      },
    });
    if (!match) return reply.code(404).send({ error: "not_found" });
    return reply.send(match);
  });
};

export default matchesRoutes;
