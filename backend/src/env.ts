import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgres")),
  INTERNAL_SERVICE_SECRET: z.string().min(20),
  ORPHAN_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export type Env = z.infer<typeof schema>;

export function parseEnv(
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid backend env: ${issues}`);
  }
  return parsed.data;
}

export const env = (() => {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET ?? "",
      ORPHAN_TTL_MINUTES: Number(process.env.ORPHAN_TTL_MINUTES ?? 10),
      LOG_LEVEL: (process.env.LOG_LEVEL ?? "info") as Env["LOG_LEVEL"],
      PORT: Number(process.env.PORT ?? 3001),
      NODE_ENV: (process.env.NODE_ENV ?? "development") as Env["NODE_ENV"]
    } satisfies Env;
  }
  return parseEnv();
})();
