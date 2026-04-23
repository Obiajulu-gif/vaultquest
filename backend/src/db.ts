import { PrismaClient } from "@prisma/client";

let client: PrismaClient | undefined;

export function getPrisma(databaseUrl?: string): PrismaClient {
  if (client) return client;
  client = new PrismaClient(
    databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : undefined
  );
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = undefined;
  }
}
