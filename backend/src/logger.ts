import pino, { type Logger } from "pino";

export function createLogger(level: string): Logger {
  return pino({
    level,
    base: { service: "vaultquest-backend" },
    timestamp: pino.stdTimeFunctions.isoTime
  });
}
