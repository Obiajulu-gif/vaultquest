import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/env.js";

describe("parseEnv", () => {
  it("accepts valid env", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://u:p@localhost:5432/db",
      INTERNAL_SERVICE_SECRET: "a-very-long-shared-secret-value-123",
      ORPHAN_TTL_MINUTES: "10",
      LOG_LEVEL: "info"
    });
    expect(env.DATABASE_URL).toBe("postgres://u:p@localhost:5432/db");
    expect(env.ORPHAN_TTL_MINUTES).toBe(10);
  });

  it("rejects missing DATABASE_URL", () => {
    expect(() =>
      parseEnv({ INTERNAL_SERVICE_SECRET: "abcdefghij1234567890" })
    ).toThrow(/DATABASE_URL/);
  });

  it("rejects short INTERNAL_SERVICE_SECRET", () => {
    expect(() =>
      parseEnv({
        DATABASE_URL: "postgres://u:p@localhost:5432/db",
        INTERNAL_SERVICE_SECRET: "short"
      })
    ).toThrow(/INTERNAL_SERVICE_SECRET/);
  });

  it("defaults ORPHAN_TTL_MINUTES to 10", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://u:p@localhost:5432/db",
      INTERNAL_SERVICE_SECRET: "a-very-long-shared-secret-value-123"
    });
    expect(env.ORPHAN_TTL_MINUTES).toBe(10);
  });
});
