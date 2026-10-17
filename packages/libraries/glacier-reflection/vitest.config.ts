import { defineConfig } from "vitest/config";

const LIFECYCLE_TIMEOUT_MS = 10_000;

export default defineConfig({
  cacheDir: "tests/artifacts/vitest",
  test: {
    environment: "node",
    pool: "forks",
    isolate: true,
    include: ["tests/scenarios/**/*.test.ts", "tests/scenarios/**/*.test.tsx"],
    globalSetup: ["tests/data/ReflectionTestPreparation.ts"],
    passWithNoTests: false,
    testTimeout: LIFECYCLE_TIMEOUT_MS,
    hookTimeout: LIFECYCLE_TIMEOUT_MS,
    teardownTimeout: LIFECYCLE_TIMEOUT_MS,
    reporters: ["default", "json"],
    outputFile: "tests/artifacts/results.json",
    coverage: {
      provider: "custom",
      customProviderModule: "tests/data/ReflectionCoverageProvider.ts",
      autoAttachSubprocess: true,
      include: ["index.ts", "register.ts", "src/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
      reportsDirectory: "tests/artifacts/coverage",
      reporter: ["text", "json", "json-summary", "html", "lcov"],
      reportOnFailure: true,
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
        perFile: { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
