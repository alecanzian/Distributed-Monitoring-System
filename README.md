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
src/core/        Sizing arithmetic from the KATA assumptions (A1–A10)
tests/           Unit tests
simulation/      Fault-injection suite (R7), stubs for now
.github/         CI workflow
```

## Development

```
npm install
npm run typecheck
npm run test:coverage
npm run test:fault
```

Requires Node.js 20 or later.

## License

See `LICENSE`.
