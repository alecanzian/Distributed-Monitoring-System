import http from "node:http";
import type { Sample } from "../core/types.js";
import { readBody, sendJson } from "./http-util.js";

export interface Aggregator {
  server: http.Server;
  /** Send everything received since the last flush to the collector. */
  flush(): Promise<void>;
}

/**
 * Site aggregator: receives samples from the agents of one site and forwards them
 * to the collector in batches. No reduction and no buffering yet: if the collector
 * is unreachable, the batch is dropped and logged (see the outage gap in the plan).
 */
export function createAggregator(collectorUrl: string): Aggregator {
  let buffer: Sample[] = [];

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://aggregator");
    if (req.method === "POST" && url.pathname === "/samples") {
      const body = JSON.parse(await readBody(req)) as { samples?: Sample[] };
      if (!Array.isArray(body.samples)) {
        return sendJson(res, 400, { error: "samples must be an array" });
      }
      buffer.push(...body.samples);
      return sendJson(res, 202, { accepted: body.samples.length });
    }
    sendJson(res, 404, { error: "not found" });
  });

  async function flush(): Promise<void> {
    if (buffer.length === 0) return;
    const samples = buffer;
    buffer = [];
    try {
      const response = await fetch(`${collectorUrl}/batches`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ samples }),
      });
      if (!response.ok) throw new Error(`collector answered ${response.status}`);
    } catch (err) {
      console.error(`aggregator: dropped ${samples.length} samples:`, err);
    }
  }

  return { server, flush };
}
