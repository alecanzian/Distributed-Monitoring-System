import { createAggregator } from "../components/aggregator.js";

const port = Number(process.env.PORT ?? 3002);
const collectorUrl = process.env.COLLECTOR_URL ?? "http://localhost:3001";
const flushMs = Number(process.env.FLUSH_MS ?? 10_000);

const aggregator = createAggregator(collectorUrl);
setInterval(() => void aggregator.flush(), flushMs);
aggregator.server.listen(port, () => {
  console.log(`aggregator listening on :${port}, forwarding to ${collectorUrl} every ${flushMs} ms`);
});
