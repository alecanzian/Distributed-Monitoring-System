import http from "node:http";
import type { SampleStore } from "../core/store.js";
import type { Sample } from "../core/types.js";
import { readBody, sendJson } from "./http-util.js";

/**
 * Central collector: receives batches from aggregators, keeps history in memory,
 * and pushes a snapshot to connected clients (server-sent events) after each batch.
 */
export function createCollector(store: SampleStore): http.Server {
  const clients = new Set<http.ServerResponse>();

  function broadcast(): void {
    const payload = `event: snapshot\ndata: ${JSON.stringify(store.machines())}\n\n`;
    for (const client of clients) client.write(payload);
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://collector");

    if (req.method === "POST" && url.pathname === "/batches") {
      const body = JSON.parse(await readBody(req)) as { samples?: Sample[] };
      if (!Array.isArray(body.samples)) {
        return sendJson(res, 400, { error: "samples must be an array" });
      }
      store.add(body.samples);
      broadcast();
      return sendJson(res, 202, { accepted: body.samples.length });
    }

    if (req.method === "GET" && url.pathname === "/snapshot") {
      return sendJson(res, 200, store.machines());
    }

    if (req.method === "GET" && url.pathname === "/history") {
      const machineId = url.searchParams.get("machineId") ?? "";
      const metric = url.searchParams.get("metric") ?? "";
      const windowMs = Number(url.searchParams.get("windowMs") ?? NaN);
      const points = store.history(machineId, metric, Number.isNaN(windowMs) ? undefined : windowMs);
      return sendJson(res, 200, points);
    }

    if (req.method === "GET" && url.pathname === "/events") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      res.write(`event: snapshot\ndata: ${JSON.stringify(store.machines())}\n\n`);
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    sendJson(res, 404, { error: "not found" });
  });
}
