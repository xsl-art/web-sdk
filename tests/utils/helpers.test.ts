import { describe, expect, it, vi } from "vitest";
import {
  generateUUID,
  getErrorUid,
  hashMapExist,
  parseUrlToObj,
  throttle,
  unknownToString,
  validateOption,
} from "@xyz-sdk/utils";

describe("helpers", () => {
  it("parseUrlToObj splits host, path and relative", () => {
    const parsed = parseUrlToObj("https://github.com/xxxx/web-sdk?token=123&name=11") as any;
    expect(parsed.host).toBe("github.com");
    expect(parsed.path).toBe("/xxxx/web-sdk");
    expect(parsed.relative).toBe("/xxxx/web-sdk?token=123&name=11");
  });

  it("generateUUID returns unique rfc4122 v4 style ids", () => {
    const id = generateUUID();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(generateUUID()).not.toBe(id);
  });

  it("validateOption checks runtime types", () => {
    expect(validateOption("abc", "name", "string")).toBe(true);
    expect(validateOption(undefined, "name", "string")).toBe(false);
    expect(validateOption(async () => {}, "fn", "function")).toBe(true);
  });

  it("throttle only fires once per delay window", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("getErrorUid + hashMapExist dedupe identical errors", () => {
    const uid = getErrorUid("error-boom-app.js-1-2");
    expect(hashMapExist(uid)).toBe(false);
    expect(hashMapExist(uid)).toBe(true);
  });

  it("unknownToString stringifies non-string values", () => {
    expect(unknownToString("a")).toBe("a");
    expect(unknownToString({ a: 1 })).toBe('{"a":1}');
    expect(unknownToString(undefined)).toBe("undefined");
  });
});
