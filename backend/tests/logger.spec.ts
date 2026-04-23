import { describe, it, expect } from "vitest";
import { createLogger } from "../src/logger.js";

describe("createLogger", () => {
  it("returns a logger with child() support", () => {
    const log = createLogger("info");
    expect(typeof log.info).toBe("function");
    const child = log.child({ correlation_id: "abc" });
    expect(typeof child.info).toBe("function");
  });
});
