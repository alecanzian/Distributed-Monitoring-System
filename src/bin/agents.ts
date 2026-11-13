import { startAgent } from "../components/agent.js";

const aggregatorUrl = process.env.AGGREGATOR_URL ?? "http://localhost:3002";
const site = process.env.SITE ?? "site-a";
const machineCount = Number(process.env.MACHINES ?? 5);
const intervalMs = Number(process.env.INTERVAL_MS ?? 10_000);

// One simulated agent per machine, all in this process for the smallest version.
for (let i = 1; i <= machineCount; i++) {
  const machineId = `machine-${String(i).padStart(2, "0")}`;
  startAgent({ aggregatorUrl, machineId, site, intervalMs });
}
console.log(`started ${machineCount} agents for ${site} -> ${aggregatorUrl} every ${intervalMs} ms`);
