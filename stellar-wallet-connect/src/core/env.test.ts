import { describe, it, expect } from "vitest";
import { parseFrontendEnv } from "./env.js";

describe("parseFrontendEnv", () => {
  it("accepts valid env", () => {
    const env = parseFrontendEnv({
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "wallet-id-123",
      NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
      NEXT_PUBLIC_HORIZON_URL: "https://horizon-testnet.stellar.org",
      NEXT_PUBLIC_SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
      NEXT_PUBLIC_DRIP_POOL_CONTRACT_ID: "CA1234DRIPPOOL"
    });

    expect(env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID).toBe("wallet-id-123");
    expect(env.NEXT_PUBLIC_DRIP_POOL_CONTRACT_ID).toBe("CA1234DRIPPOOL");
  });

  it("rejects missing required values", () => {
    expect(() =>
      parseFrontendEnv({
        NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
        NEXT_PUBLIC_HORIZON_URL: "https://horizon-testnet.stellar.org",
        NEXT_PUBLIC_SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
        NEXT_PUBLIC_DRIP_POOL_CONTRACT_ID: "CA1234DRIPPOOL"
      })
    ).toThrow(/NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID/);
  });

  it("rejects placeholder values", () => {
    expect(() =>
      parseFrontendEnv({
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "YOUR_PROJECT_ID",
        NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
        NEXT_PUBLIC_HORIZON_URL: "https://horizon-testnet.stellar.org",
        NEXT_PUBLIC_SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
        NEXT_PUBLIC_DRIP_POOL_CONTRACT_ID: "CA_PLACEHOLDER_DRIP_POOL_CONTRACT_ID"
      })
    ).toThrow(/placeholder/i);
  });

  it("rejects invalid URLs", () => {
    expect(() =>
      parseFrontendEnv({
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "wallet-id-123",
        NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
        NEXT_PUBLIC_HORIZON_URL: "not-a-url",
        NEXT_PUBLIC_SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
        NEXT_PUBLIC_DRIP_POOL_CONTRACT_ID: "CA1234DRIPPOOL"
      })
    ).toThrow(/NEXT_PUBLIC_HORIZON_URL/);
  });
});
