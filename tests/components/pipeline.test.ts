import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createAggregator } from "../../src/components/aggregator.js";
import { buildSamples, metricName, nextValues, METRIC_COUNT } from "../../src/components/agent.js";
import { createCollector } from "../../src/components/collector.js";
import { SampleStore } from "../../src/core/store.js";
import type { MachineState } from "../../src/core/types.js";

const open: http.Server[] = [];

function start(server: http.Server): Promise<string> {
  open.push(server);
  return new Promise((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve(`http://localhost:${port}`);
    });
  });
}

afterEach(() => {
  for (const s of open.splice(0)) s.close();
});

describe("agent -> aggregator -> collector", () => {
  it("delivers one agent's samples to the collector snapshot", async () => {
    const collectorUrl = await start(createCollector(new SampleStore()));
    const aggregator = createAggregator(collectorUrl);
    const aggregatorUrl = await start(aggregator.server);

    const samples = buildSamples("machine-01", "site-a", Date.now(), Array(METRIC_COUNT).fill(42));
    await fetch(`${aggregatorUrl}/samples`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ samples }),
    });
    await aggregator.flush();

    const machines = (await (await fetch(`${collectorUrl}/snapshot`)).json()) as MachineState[];
    expect(machines).toHaveLength(1);
    expect(machines[0]).toMatchObject({ machineId: "machine-01", site: "site-a", status: "ok" });
    expect(Object.keys(machines[0].latest)).toHaveLength(METRIC_COUNT);
    expect(machines[0].latest[metricName(0)]).toBe(42);
  });

  it("returns 400 for a malformed collector batch", async () => {
    const collectorUrl = await start(createCollector(new SampleStore()));
    const res = await fetch(`${collectorUrl}/batches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ samples: "nope" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns history for a machine and metric", async () => {
    const collectorUrl = await start(createCollector(new SampleStore()));
    await fetch(`${collectorUrl}/batches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        samples: [{ machineId: "m1", site: "s", metric: "metric_00", value: 3, ts: Date.now() }],
      }),
    });
    const points = (await (await fetch(`${collectorUrl}/history?machineId=m1&metric=metric_00`)).json()) as {
      value: number;
    }[];
    expect(points.map((p) => p.value)).toEqual([3]);
  });

  it("answers 404 for unknown routes", async () => {
    const aggregatorUrl = await start(createAggregator("http://unused").server);
    expect((await fetch(`${aggregatorUrl}/nope`)).status).toBe(404);
  });
});

describe("agent helpers", () => {
  it("keeps simulated values within 0..100", () => {
    const values = nextValues(Array(METRIC_COUNT).fill(0), () => 0);
    expect(values.every((v) => v >= 0 && v <= 100)).toBe(true);
  });
});
