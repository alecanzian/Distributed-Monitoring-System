import type { MachineState, Point, Sample } from "./types.js";

/** History kept in memory: the 6 h window (A7). */
export const RETENTION_MS = 6 * 60 * 60 * 1000;

/** A machine with no sample for this long is shown as down (R2). */
export const DOWN_AFTER_MS = 30_000;

/**
 * In-memory store of samples for the central collector.
 * No persistence: a restart loses data (accepted for the smallest version).
 */
export class SampleStore {
  /** machineId -> metric -> points in time order. */
  private readonly points = new Map<string, Map<string, Point[]>>();
  private readonly meta = new Map<string, { site: string; lastSeen: number }>();

  constructor(private readonly clock: () => number = Date.now) {}

  add(samples: Sample[]): void {
    for (const s of samples) {
      let metrics = this.points.get(s.machineId);
      if (!metrics) {
        metrics = new Map();
        this.points.set(s.machineId, metrics);
      }
      let series = metrics.get(s.metric);
      if (!series) {
        series = [];
        metrics.set(s.metric, series);
      }
      series.push({ ts: s.ts, value: s.value });

      const known = this.meta.get(s.machineId);
      if (!known || s.ts >= known.lastSeen) {
        this.meta.set(s.machineId, { site: s.site, lastSeen: s.ts });
      }
    }
    this.prune();
  }

  /** Drop points older than the retention window. */
  prune(): void {
    const cutoff = this.clock() - RETENTION_MS;
    for (const metrics of this.points.values()) {
      for (const [metric, series] of metrics) {
        const firstKept = series.findIndex((p) => p.ts >= cutoff);
        if (firstKept === -1) {
          metrics.set(metric, []);
        } else if (firstKept > 0) {
          series.splice(0, firstKept);
        }
      }
    }
  }

  machines(): MachineState[] {
    const now = this.clock();
    return [...this.meta.entries()].map(([machineId, { site, lastSeen }]) => {
      const latest: Record<string, number> = {};
      for (const [metric, series] of this.points.get(machineId) ?? []) {
        const last = series[series.length - 1];
        if (last) latest[metric] = last.value;
      }
      return {
        machineId,
        site,
        status: now - lastSeen > DOWN_AFTER_MS ? "down" : "ok",
        lastSeen,
        latest,
      };
    });
  }

  history(machineId: string, metric: string, windowMs: number = RETENTION_MS): Point[] {
    const cutoff = this.clock() - Math.min(windowMs, RETENTION_MS);
    const series = this.points.get(machineId)?.get(metric) ?? [];
    return series.filter((p) => p.ts >= cutoff);
  }
}
