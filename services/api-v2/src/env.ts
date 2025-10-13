import { z } from "zod";
const EnvSchema = z.object({
  NODE_ENV: z.string().default("production"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default("info"),
  APP_BASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),

  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("redis"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_PAYMENT_PROVIDER_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional()
});
export const env = EnvSchema.parse(process.env);
export function buildRedisUrl(): string {
  if (env.REDIS_URL && env.REDIS_URL.length > 0) return env.REDIS_URL;
  const auth = env.REDIS_PASSWORD ? `:${env.REDIS_PASSWORD}@` : "";
  return `redis://${auth}${env.REDIS_HOST}:${env.REDIS_PORT}/0`;
}
