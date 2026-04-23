import type { FastifyRequest } from "fastify";
import { AppError } from "../errors.js";

export function requireServiceAuth(expectedSecret: string) {
  return async function (req: FastifyRequest): Promise<void> {
    const provided = req.headers["x-internal-secret"];
    if (typeof provided !== "string" || provided !== expectedSecret) {
      throw AppError.unauthorized();
    }
  };
}
