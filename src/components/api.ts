import http from "node:http";
import { readFile } from "node:fs/promises";
import { sendJson } from "./http-util.js";

/**
 * API server: serves the web UI and relays read requests and live events from the collector.
 */
export function createApi(collectorUrl: string, indexHtmlPath: string): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://api");

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const html = await readFile(indexHtmlPath, "utf8");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(html);
    }

    if (req.method === "GET" && url.pathname === "/api/snapshot") {
      const upstream = await fetch(`${collectorUrl}/snapshot`);
      return sendJson(res, upstream.status, await upstream.json());
    }

    if (req.method === "GET" && url.pathname === "/api/history") {
      const upstream = await fetch(`${collectorUrl}/history${url.search}`);
      return sendJson(res, upstream.status, await upstream.json());
    }

    if (req.method === "GET" && url.pathname === "/api/events") {
      http.get(`${collectorUrl}/events`, (upstream) => {
        res.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
        });
        upstream.pipe(res);
        req.on("close", () => upstream.destroy());
      });
      return;
    }

    sendJson(res, 404, { error: "not found" });
  });
}
