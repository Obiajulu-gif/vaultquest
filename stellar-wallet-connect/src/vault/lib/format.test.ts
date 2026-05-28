import { describe, it, expect } from "vitest";
import { explorerTxUrl, formatAmount, formatDate, truncateAddress } from "./format";

describe("truncateAddress", () => {
  it("truncates long Stellar addresses with an ellipsis", () => {
    const addr = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    expect(truncateAddress(addr)).toBe("GBBD47…FLA5");
  });

  it("returns short strings unchanged", () => {
    expect(truncateAddress("GABC")).toBe("GABC");
  });

  it("handles empty input", () => {
    expect(truncateAddress("")).toBe("");
  });
});

describe("formatAmount", () => {
  it("formats with thousands separators and asset code", () => {
    expect(formatAmount("1250", "USDC")).toBe("1,250 USDC");
  });

  it("omits the asset when not provided", () => {
    expect(formatAmount(1000)).toBe("1,000");
  });
});

describe("formatDate", () => {
  it("formats an ISO date", () => {
    expect(formatDate("2026-05-28T00:00:00Z")).toMatch(/2026/);
  });

  it("returns a dash for missing/invalid input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("explorerTxUrl", () => {
  it("builds a testnet explorer link by default", () => {
    expect(explorerTxUrl("abc123")).toBe("https://stellar.expert/explorer/testnet/tx/abc123");
  });

  it("builds a public network link", () => {
    expect(explorerTxUrl("abc123", "public")).toBe("https://stellar.expert/explorer/public/tx/abc123");
  });
});
