import type { FastifyRequest } from "fastify";
import { AppError } from "../errors.js";

/**
 * Extracts the wallet address from the X-Wallet-Address header.
 * Returns undefined when the header is absent (unauthenticated request).
 */
export function getRequestWallet(req: FastifyRequest): string | undefined {
  const h = req.headers["x-wallet-address"];
  return typeof h === "string" && h.length > 0 ? h : undefined;
}

/**
 * preHandler guard: requires X-Wallet-Address to be present.
 * Does NOT verify a cryptographic signature at this layer — that is
 * delegated to the Stellar wallet-connect flow on the frontend.
 * The header is treated as a bearer identity claim; ownership checks
 * (wallet === record.walletAddress) are enforced per-route.
 */
export function requireWalletAuth(req: FastifyRequest): void {
  if (!getRequestWallet(req)) {
    throw AppError.unauthorized();
  }
}

/**
 * Asserts that the authenticated wallet matches an expected address.
 * Throws 401 when no wallet header is present, 403 when it is present
 * but does not match.
 */
export function assertWalletOwnership(req: FastifyRequest, expectedWallet: string): void {
  const wallet = getRequestWallet(req);
  if (!wallet) {
    throw AppError.unauthorized();
  }
  if (wallet !== expectedWallet) {
    throw AppError.forbidden();
  }
}
