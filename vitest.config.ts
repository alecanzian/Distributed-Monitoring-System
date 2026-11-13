import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "simulation/**/*.test.ts"],
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: ["src/core/**/*.ts"],
      // Testability target: at least 80% line coverage on core logic (characteristics.md).
      thresholds: {
        lines: 80,
      },
    },
  },
});
