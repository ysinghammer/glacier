import { defineConfig } from "vitest/config";

const LIFECYCLE_TIMEOUT_MS = 10_000;
const FULL_COVERAGE_PERCENT = 100;

export default defineConfig({
  cacheDir: "tests/artifacts/vitest",
  test: {
    environment: "node",
    pool: "forks",
    isolate: true,
    include: ["tests/scenarios/**/*.test.ts"],
    passWithNoTests: false,
    testTimeout: LIFECYCLE_TIMEOUT_MS,
    hookTimeout: LIFECYCLE_TIMEOUT_MS,
    teardownTimeout: LIFECYCLE_TIMEOUT_MS,
    reporters: ["default", "json"],
    outputFile: "tests/artifacts/results.json",
    coverage: {
      provider: "v8",
      include: ["index.ts", "src/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
      reportsDirectory: "tests/artifacts/coverage",
      reporter: ["text", "json", "json-summary", "html", "lcov"],
      reportOnFailure: true,
      thresholds: {
        statements: FULL_COVERAGE_PERCENT,
        branches: FULL_COVERAGE_PERCENT,
        functions: FULL_COVERAGE_PERCENT,
        lines: FULL_COVERAGE_PERCENT,
        perFile: true,
      },
    },
  },
});
