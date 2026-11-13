import { describe, expect, it } from "vitest";
import { DOWN_AFTER_MS, RETENTION_MS, SampleStore } from "../../src/core/store.js";
import type { Sample } from "../../src/core/types.js";

function sample(over: Partial<Sample> & { ts: number }): Sample {
  return { machineId: "m1", site: "site-a", metric: "metric_00", value: 10, ...over };
}

function fakeClock(start: number) {
  let now = start;
  return { clock: () => now, advance: (ms: number) => (now += ms) };
}

describe("SampleStore", () => {
  it("reports the latest value per metric and the site of a machine", () => {
    const { clock } = fakeClock(1_000_000);
    const store = new SampleStore(clock);
    store.add([
      sample({ ts: 1_000_000 - 10_000, value: 1 }),
      sample({ ts: 1_000_000, value: 2 }),
      sample({ ts: 1_000_000, metric: "metric_01", value: 7 }),
    ]);
    const [machine] = store.machines();
    expect(machine).toMatchObject({ machineId: "m1", site: "site-a", status: "ok" });
    expect(machine.latest).toEqual({ metric_00: 2, metric_01: 7 });
  });

  it("marks a machine down after 30 s without samples", () => {
    const { clock, advance } = fakeClock(1_000_000);
    const store = new SampleStore(clock);
    store.add([sample({ ts: 1_000_000 })]);
    advance(DOWN_AFTER_MS + 1);
    expect(store.machines()[0].status).toBe("down");
  });

  it("keeps only the 6 h retention window", () => {
    const { clock, advance } = fakeClock(0);
    const store = new SampleStore(clock);
    store.add([sample({ ts: 0, value: 1 })]);
    advance(RETENTION_MS + 10_000);
    store.add([sample({ ts: RETENTION_MS + 10_000, value: 2 })]);
    const points = store.history("m1", "metric_00");
    expect(points).toEqual([{ ts: RETENTION_MS + 10_000, value: 2 }]);
  });

  it("returns history for one metric within a window", () => {
    const { clock } = fakeClock(100_000);
    const store = new SampleStore(clock);
    store.add([
      sample({ ts: 10_000, value: 1 }),
      sample({ ts: 95_000, value: 2 }),
      sample({ ts: 100_000, value: 3, metric: "metric_01" }),
    ]);
    expect(store.history("m1", "metric_00", 20_000)).toEqual([{ ts: 95_000, value: 2 }]);
    expect(store.history("m1", "missing")).toEqual([]);
    expect(store.history("unknown", "metric_00")).toEqual([]);
  });

  it("returns an empty list when there are no machines", () => {
    expect(new SampleStore().machines()).toEqual([]);
  });

  it("caps the window at the 6 h retention", () => {
    const { clock } = fakeClock(RETENTION_MS * 2);
    const store = new SampleStore(clock);
    store.add([sample({ ts: RETENTION_MS * 2 - 1, value: 5 })]);
    expect(store.history("m1", "metric_00", RETENTION_MS * 10)).toHaveLength(1);
  });
});
