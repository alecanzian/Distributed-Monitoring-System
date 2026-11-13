# Distributed-Monitoring-System

A distributed monitoring system that offers a whole-system view of the infrastructure and its health status.

University KATA by Alessandro Canzian (894004).

## Requirements traceability

Requirement IDs follow the KATA. Source code and tests refer to them so the architecture document and the implementation stay linked.

- **Users and scale (U1–U4):** up to 100 tenants, 200 machines per tenant, 20,000 machines in total, about 800 concurrent UI sessions at peak.
- **Functional (R1–R8):** live map (R1), failure visibility (R2), zoom to a single machine (R3), history (R4), tenant isolation (R5), operator/manager roles (R6), buffering and replay (R7), no saturation of site links (R8).
- **Context (C1–C3):** heterogeneous machines (C1), unreliable site links (C2), location transparency for cloud and on-premise machines (C3).

## Architecture characteristics

Selected characteristics and their quantified targets are in the architecture document (`characteristics.md`). The Testability targets map to this repository as follows:

- 80% line coverage on core logic: `npm run test:coverage`, enforced in `vitest.config.ts`.
- Fault-injection suite for outages from 1 min to 2 h: `npm run test:fault`, in `simulation/`.
- 100% of endpoints covered by authorization tests: to be added with the first endpoint.

## Layout

```
src/core/        Sizing arithmetic and the in-memory sample store
src/components/  Agent, aggregator, collector, API server, shared HTTP helpers
src/bin/         Entry points that start each component
web/             Single-page web UI served by the API server
tests/           Unit and pipeline tests
simulation/      Fault-injection suite (R7), stubs for now
.github/         CI workflow
```

## Running the smallest version

The system has five parts: simulated agents (one per machine), a site aggregator, the central collector, the API server and the web UI. Pick one of the two ways below. Both open the dashboard at http://localhost:3000.

### Option 1: containers (recommended, nothing to install on your PC except Docker)

```
docker compose up --build
```

Then open http://localhost:3000. Stop with `Ctrl+C`, or `docker compose down` to remove the containers.

### Option 2: local Node.js (for development)

Requires Node.js 20 or later.

```
npm install
npm run start:collector     # terminal 1, port 3001
npm run start:aggregator    # terminal 2, port 3002
npm run start:agents        # terminal 3, five simulated machines
npm run start:api           # terminal 4, port 3000
```

Start the collector first, then the aggregator, the agents and the API. The ports and URLs can be changed with the environment variables `PORT`, `COLLECTOR_URL`, `AGGREGATOR_URL`, `SITE`, `MACHINES` and `INTERVAL_MS`, as set in `docker-compose.yml`.

## Development checks

```
npm run typecheck
npm run test:coverage
npm run test:fault
```

## License

See `LICENSE`.
