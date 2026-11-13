import { describe, it } from "vitest";

/**
 * Fault-injection suite (Testability target: full suite under 15 min in CI).
 * Covers buffering and replay (R7) for outages from 1 min to 2 h, at 1,000 samples/s per site.
 * Stubs only: the simulator is to be written once the design is settled.
 */
describe("fault injection: buffering and replay (R7)", () => {
  it.todo("zero data loss for a 1 min outage");
  it.todo("zero data loss for a 2 h outage at 1,000 samples/s");
  it.todo("live samples keep priority over replay during recovery (R2)");
  it.todo("backlog drains in about 6.5 min for a 2 h outage (A9)");
});
