import { z } from "zod";

const placeholderPattern = /PLACEHOLDER|YOUR_|CHANGE-ME|EXAMPLE|<.+?>/i;

const schema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgres")),
  INTERNAL_SERVICE_SECRET: z
    .string()
    .min(20)
    .refine((value) => !placeholderPattern.test(value), {
      message: "INTERNAL_SERVICE_SECRET must not be a placeholder value"
    }),
  ORPHAN_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Stellar indexer daemon (#indexer). Optional: when both are set the daemon
  // polls the Soroban RPC for the listed contracts' events.
  SOROBAN_RPC_URL: z.string().url().optional(),
  INDEXER_CONTRACT_IDS: z.string().optional()
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

export function getEnv(): Env {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET ?? "",
      ORPHAN_TTL_MINUTES: Number(process.env.ORPHAN_TTL_MINUTES ?? 10),
      LOG_LEVEL: (process.env.LOG_LEVEL ?? "info") as Env["LOG_LEVEL"],
      PORT: Number(process.env.PORT ?? 3001),
      NODE_ENV: (process.env.NODE_ENV ?? "development") as Env["NODE_ENV"],
      SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL || undefined,
      INDEXER_CONTRACT_IDS: process.env.INDEXER_CONTRACT_IDS || undefined
    } satisfies Env;
  }
  return parseEnv();
}
