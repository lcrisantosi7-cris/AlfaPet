import { describe, expect, it } from "vitest";
import { RateLimiter } from "../app/core/security/rate-limiter.server";

describe("RateLimiter", () => {
  it("bloquea después del máximo de intentos y permite reiniciar la clave", () => {
    const limiter = new RateLimiter(2, 60_000);
    expect(limiter.isLimited("ip:user")).toBe(false);
    expect(limiter.isLimited("ip:user")).toBe(false);
    expect(limiter.isLimited("ip:user")).toBe(true);
    limiter.reset("ip:user");
    expect(limiter.isLimited("ip:user")).toBe(false);
  });

  it("mantiene contadores separados por clave", () => {
    const limiter = new RateLimiter(1, 60_000);
    expect(limiter.isLimited("one")).toBe(false);
    expect(limiter.isLimited("two")).toBe(false);
    expect(limiter.isLimited("one")).toBe(true);
  });
});
