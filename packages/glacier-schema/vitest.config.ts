import { defineConfig } from 'vitest/config';

/**
 * Package tests are black-box only and live under `./test`, exercising the
 * package exclusively through what `index.ts` exports (see the workspace
 * `code-style` skill). Coverage is measured against `index.ts` and `src/`
 * and MUST stay at 100%. Pure type-only files (interfaces/type aliases with
 * no runtime statements) are excluded: they always compile to empty JS and
 * v8 misreports them as 0%, even though there is nothing to cover.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['index.ts', 'src/**/*.ts'],
      exclude: [
        'src/definition/**',
        'src/schema/_interfaces/**',
        'src/validation/**/_interfaces/**'
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
