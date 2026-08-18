import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { OfflineReportCache } from "@websdk/utils";

function makeRecord(createdAt: number) {
  return {
    data: { type: "error", message: `err-${createdAt}` },
    dsn: "http://localhost:3001/report",
    createdAt,
    retryCount: 0,
  };
}

describe("OfflineReportCache", () => {
  let cache: OfflineReportCache;

  beforeEach(async () => {
    cache = new OfflineReportCache();
    const records = await cache.list();
    await Promise.all(records.map(record => cache.remove(record.id as number)));
  });

  it("lists records sorted by createdAt", async () => {
    await cache.add(makeRecord(3000));
    await cache.add(makeRecord(1000));
    await cache.add(makeRecord(2000));
    const records = await cache.list();
    expect(records.map(record => record.createdAt)).toEqual([1000, 2000, 3000]);
  });

  it("updates retryCount", async () => {
    await cache.add(makeRecord(1000));
    const [record] = await cache.list();
    await cache.update({ ...record, retryCount: record.retryCount + 1 });
    const [updated] = await cache.list();
    expect(updated.retryCount).toBe(1);
  });

  it("trims the oldest records beyond maxSize", async () => {
    for (let i = 1; i <= 5; i++) {
      await cache.add(makeRecord(i * 1000));
    }
    await cache.trimToMaxSize(2);
    const records = await cache.list();
    expect(records.map(record => record.createdAt)).toEqual([4000, 5000]);
  });

  it("clears expired records and keeps fresh ones", async () => {
    const now = Date.now();
    await cache.add(makeRecord(now - 2 * 60 * 60 * 1000));
    await cache.add(makeRecord(now));
    await cache.clearExpired(60 * 60 * 1000);
    const records = await cache.list();
    expect(records).toHaveLength(1);
    expect(records[0].createdAt).toBe(now);
  });
});
