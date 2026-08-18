import { describe, expect, it } from "vitest";
import { Queue } from "@xyz-sdk/utils";

describe("Queue", () => {
  it("queues callbacks and flushes them asynchronously in order", async () => {
    const queue = new Queue();
    const calls: number[] = [];
    queue.addFn(() => calls.push(1));
    queue.addFn(() => calls.push(2));
    expect(calls).toEqual([]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(calls).toEqual([1, 2]);
  });

  it("ignores non-function input", () => {
    const queue = new Queue();
    queue.addFn(null as any);
    expect(queue.getStack()).toEqual([]);
  });

  it("clear discards pending callbacks before flush", async () => {
    const queue = new Queue();
    const calls: number[] = [];
    queue.addFn(() => calls.push(1));
    queue.clear();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(calls).toEqual([]);
  });
});
