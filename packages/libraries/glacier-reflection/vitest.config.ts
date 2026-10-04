import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const RUNTIME_SCENARIOS = ["tests/scenarios/**/*.test.ts", "tests/scenarios/**/*.test.tsx"];
const LIFECYCLE_TIMEOUT_MS = 10_000;

export default defineConfig({
  cacheDir: "tests/artifacts/vitest",
  test: {
    passWithNoTests: false,
    teardownTimeout: LIFECYCLE_TIMEOUT_MS,
    reporters: ["default", "json"],
    outputFile: "tests/artifacts/results.json",
    coverage: {
      provider: "v8",
      include: ["index.ts", "src/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
      reportsDirectory: "tests/artifacts/coverage",
      reporter: ["text", "json", "html", "lcov"],
      reportOnFailure: true,
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        perFile: true,
      },
    },
    projects: [
      {
        cacheDir: "tests/artifacts/vitest/node",
        test: {
          name: "node",
          environment: "node",
          include: RUNTIME_SCENARIOS,
          testTimeout: LIFECYCLE_TIMEOUT_MS,
          hookTimeout: LIFECYCLE_TIMEOUT_MS,
        },
      },
      {
        cacheDir: "tests/artifacts/vitest/chromium",
        test: {
          name: "chromium",
          include: RUNTIME_SCENARIOS,
          testTimeout: LIFECYCLE_TIMEOUT_MS,
          hookTimeout: LIFECYCLE_TIMEOUT_MS,
          exclude: ["tests/scenarios/node/**"],
          browser: {
            enabled: true,
            headless: true,
            connectTimeout: LIFECYCLE_TIMEOUT_MS,
            provider: playwright({ launchOptions: { timeout: LIFECYCLE_TIMEOUT_MS } }),
            instances: [{ browser: "chromium" }],
            screenshotDirectory: "tests/artifacts/screenshots",
          },
        },
      },
    ],
  },
});
