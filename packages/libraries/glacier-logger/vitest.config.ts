import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const LIFECYCLE_TIMEOUT_MS = 10_000;
const FULL_COVERAGE_PERCENT = 100;

const shared = {
  include: ["tests/scenarios/**/*.test.ts"],
  testTimeout: LIFECYCLE_TIMEOUT_MS,
  hookTimeout: LIFECYCLE_TIMEOUT_MS,
  teardownTimeout: LIFECYCLE_TIMEOUT_MS,
};

export default defineConfig({
  cacheDir: "tests/artifacts/vitest",
  test: {
    passWithNoTests: false,
    reporters: ["default", "json"],
    outputFile: "tests/artifacts/results.json",
    projects: [
      {
        extends: true,
        test: {
          ...shared,
          name: "node",
          environment: "node",
          pool: "forks",
          isolate: true,
        },
      },
      {
        extends: true,
        test: {
          ...shared,
          name: "browser",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["index.ts", "index.browser.ts", "src/**/*.ts"],
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
