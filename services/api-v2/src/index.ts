import "dotenv/config";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyJwt from "@fastify/jwt";
import { env } from "./env.js";
import redisPlugin from "./plugins/redis.js";
import socketPlugin from "./plugins/socket.js";
import systemRoutes from "./routes/system.js";
import authRoutes from "./routes/auth.js";
import paymentsRoutes from "./routes/payments.js";
import rngRoutes from "./routes/rng.js";

const app = Fastify({ logger: { level: env.LOG_LEVEL } });
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, { origin: true, credentials: true });
await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! });
await app.register(redisPlugin);
await app.register(socketPlugin);

await app.register(systemRoutes, { prefix: "/api/v2" });
await app.register(authRoutes, { prefix: "/api/v2" });
await app.register(paymentsRoutes, { prefix: "/api/v2" });
await app.register(rngRoutes, { prefix: "/api/v2" });

await app.listen({ port: env.PORT, host: env.HOST });
app.log.info(`API V2 listening at ${env.HOST}:${env.PORT} (prefix=/api/v2, ws=/socket.io-v2)`);
