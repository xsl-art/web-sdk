import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT_TYPE } from "@websdk/common";
import { TokenBucket } from "@websdk/utils";
import { TransportData } from "../../packages/core/src/core/reportData";

function createTransport(): TransportData {
  const transport = new TransportData();
  transport.errorDsn = "http://localhost:3001/report";
  transport.apiKey = "test-app";
  return transport;
}

function makeError(errorUid?: string) {
  return {
    type: EVENT_TYPE.ERROR,
    status: "error",
    time: Date.now(),
    message: "boom",
    errorUid,
  } as any;
}

function blobToJson(blob: Blob): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(JSON.parse(reader.result as string));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe("TransportData", () => {
  let beaconSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    beaconSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true,
    });
    Object.defineProperty(window.navigator, "sendBeacon", {
      value: beaconSpy,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("drops reports when sampleRate is 0", async () => {
    const transport = createTransport();
    transport.sampleRate = 0;
    await transport.send(makeError());
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it("per-type sample rate overrides the global rate", async () => {
    const transport = createTransport();
    transport.sampleRate = 1;
    transport.sampleRateByType = { [EVENT_TYPE.ERROR]: 0 };
    await transport.send(makeError());
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it("rate limiter caps the number of delivered reports", async () => {
    const transport = createTransport();
    (transport as any).rateLimiter = new TokenBucket(2);
    await transport.send(makeError());
    await transport.send(makeError());
    await transport.send(makeError());
    expect(beaconSpy).toHaveBeenCalledTimes(2);
  });

  it("batches reports and flushes once batchSize is reached", async () => {
    const transport = createTransport();
    transport.batchReport = true;
    transport.batchSize = 3;
    await transport.send(makeError());
    await transport.send(makeError());
    expect(beaconSpy).not.toHaveBeenCalled();
    await transport.send(makeError());
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    const blob = beaconSpy.mock.calls[0][1] as Blob;
    const payload = await blobToJson(blob);
    expect(payload.batch).toBe(true);
    expect(payload.apiKey).toBe("test-app");
    expect(payload.list).toHaveLength(3);
  });

  it("aggregates repeated errors by errorUid and flushes the folded count", async () => {
    vi.useFakeTimers();
    const transport = createTransport();
    transport.aggregateErrors = true;
    transport.aggregateInterval = 1000;
    await transport.send(makeError("uid-1"));
    await transport.send(makeError("uid-1"));
    await transport.send(makeError("uid-1"));
    expect(beaconSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(beaconSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
    const blob = beaconSpy.mock.calls[1][1] as Blob;
    const payload = await blobToJson(blob);
    expect(payload.isAggregate).toBe(true);
    expect(payload.count).toBe(2);
  });
});
