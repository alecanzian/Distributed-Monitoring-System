import { describe, expect, it } from "vitest";
import {
  bufferHoursAtRate,
  drainSeconds,
  fleetSamplesPerSecond,
  outageBufferBytes,
  rawBytesPerSecond,
  replaySamplesPerSecond,
  samplesPerSecondPerMachine,
} from "../../src/core/sizing.js";

describe("sizing assumptions", () => {
  it("gives 5 samples/s per machine (A1, A2)", () => {
    expect(samplesPerSecondPerMachine()).toBe(5);
  });

  it("gives 100,000 samples/s for the 20,000-machine fleet (A3)", () => {
    expect(fleetSamplesPerSecond(20_000)).toBe(100_000);
  });

  it("gives 1,000 samples/s for one tenant at its 200-machine limit (A3)", () => {
    expect(fleetSamplesPerSecond(200)).toBe(1_000);
  });

  it("gives 32 KB/s raw for the worst-case site (A5)", () => {
    expect(rawBytesPerSecond(1_000)).toBe(32_000);
  });

  it("allows about 19,500 replayed samples/s at 5 Mbit/s (A9)", () => {
    expect(replaySamplesPerSecond()).toBe(19_531);
  });

  it("sizes a 2 h outage at 1,000 samples/s to about 230 MB (A8)", () => {
    const bytes = outageBufferBytes(2, 1_000);
    expect(bytes).toBe(230_400_000);
    expect(bytes / 1e6).toBeCloseTo(230.4, 1);
  });

  it("holds about 9 h in a 1 GB buffer at 1,000 samples/s (A8)", () => {
    expect(bufferHoursAtRate(1e9, 1_000)).toBeCloseTo(8.68, 1);
  });

  it("drains a 2 h backlog in about 6.5 min with live traffic (A9)", () => {
    const backlog = 7_200 * 1_000;
    const seconds = drainSeconds(backlog, 1_000);
    expect(seconds / 60).toBeCloseTo(6.5, 0);
  });

  it("never drains when live traffic exceeds the replay cap", () => {
    expect(drainSeconds(1_000, 50_000)).toBe(Number.POSITIVE_INFINITY);
  });

  it("rejects negative machine counts", () => {
    expect(() => fleetSamplesPerSecond(-1)).toThrow(RangeError);
  });
});
