import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSampledHit, TokenBucket } from "@xyz-sdk/utils";

describe("TokenBucket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows a burst up to capacity then blocks", () => {
    const bucket = new TokenBucket(3);
    expect(bucket.tryConsume()).toBe(true);
    expect(bucket.tryConsume()).toBe(true);
    expect(bucket.tryConsume()).toBe(true);
    expect(bucket.tryConsume()).toBe(false);
  });

  it("refills tokens smoothly across a one minute window", () => {
    const bucket = new TokenBucket(60);
    for (let i = 0; i < 60; i++) bucket.tryConsume();
    expect(bucket.tryConsume()).toBe(false);

    vi.advanceTimersByTime(30_000);
    let allowed = 0;
    for (let i = 0; i < 60; i++) {
      if (bucket.tryConsume()) allowed++;
    }
    expect(allowed).toBeGreaterThanOrEqual(29);
    expect(allowed).toBeLessThanOrEqual(31);
  });

  it("never refills beyond capacity", () => {
    const bucket = new TokenBucket(5);
    vi.advanceTimersByTime(10 * 60_000);
    expect(bucket.getTokens()).toBe(5);
  });
});

describe("isSampledHit", () => {
  it("clamps boundaries", () => {
    expect(isSampledHit(1)).toBe(true);
    expect(isSampledHit(0)).toBe(false);
    expect(isSampledHit(-1)).toBe(false);
    expect(isSampledHit(2)).toBe(true);
  });
});
