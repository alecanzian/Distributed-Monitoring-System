import type { Sample } from "../core/types.js";

/** Metrics per machine (A2). */
export const METRIC_COUNT = 50;

export function metricName(index: number): string {
  return `metric_${String(index).padStart(2, "0")}`;
}

/**
 * Advance a simulated machine by one step: each metric random-walks within 0..100.
 * `random` returns a number in [0, 1); injected so tests are deterministic.
 */
export function nextValues(previous: number[], random: () => number = Math.random): number[] {
  return previous.map((v) => {
    const step = (random() - 0.5) * 2;
    return Math.min(100, Math.max(0, v + step));
  });
}

export function buildSamples(machineId: string, site: string, ts: number, values: number[]): Sample[] {
  return values.map((value, i) => ({
    machineId,
    site,
    metric: metricName(i),
    value: Math.round(value * 100) / 100,
    ts,
  }));
}

export interface AgentOptions {
  aggregatorUrl: string;
  machineId: string;
  site: string;
  intervalMs: number;
}

/**
 * Simulated agent for one machine: every interval it produces its metrics and
 * posts them to the site aggregator. Stands in for real machines in this version.
 */
export function startAgent(opts: AgentOptions): () => void {
  let values = Array.from({ length: METRIC_COUNT }, () => 50);

  const timer = setInterval(async () => {
    values = nextValues(values);
    const samples = buildSamples(opts.machineId, opts.site, Date.now(), values);
    try {
      await fetch(`${opts.aggregatorUrl}/samples`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ samples }),
      });
    } catch (err) {
      console.error(`agent ${opts.machineId}: aggregator unreachable:`, err);
    }
  }, opts.intervalMs);

  return () => clearInterval(timer);
}
