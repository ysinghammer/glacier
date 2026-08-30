---
name: workspace-create-package
description: Scaffold a new internal TypeScript library package under packages/ in this monorepo. Use when adding a new shared/internal package, library, or module meant to be consumed by other workspace packages or applications.
---

# Workspace: create package

Apply this standard whenever a new internal-only TypeScript library is added under `packages/`. It reflects the exact setup used by `packages/glacier-schema`, the reference implementation.

## Naming

- Folder name: `glacier-<name>` (e.g. `glacier-schema`).
- Package name in `package.json`: `@glacier/<name>` — drop the `glacier-` prefix (e.g. `@glacier/schema`), matching `applications/glacier-backend-core` → `@glacier/backend-core`.

## Required structure

```text
packages/glacier-<name>/
  index.ts          # barrel file, re-exports everything public
  src/               # all implementation source
  package.json
  tsconfig.json
```

- `index.ts` lives at the package root and only re-exports from `src/`. Do not put implementation logic directly in `index.ts`.
- All source code, including internal helpers not meant for consumers, lives under `src/`.
- No local test files and no local lint config: tests belong in the global `tests` package, and linting is handled by the root `.oxlintrc.json`. Do not add a package-level `.oxlintrc.json`, test runner config, or spec files.

## `package.json`

Internal packages are ESM, private, built with plain `tsc`, and expose compiled output (not raw `.ts`) via `main`/`types`/`exports`:

```json
{
  "name": "@glacier/<name>",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^7.0.2"
  }
}
```

Add runtime dependencies under `dependencies` as needed; keep `typescript` as the only default devDependency unless the package genuinely needs more.

## `tsconfig.json`

Minimal, strict, ESM-targeted config that emits declarations and JS into `dist/`:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "esnext",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["index.ts", "src/**/*.ts"]
}
```

Do not add a separate `tsconfig.build.json` unless the package later needs to exclude test files from the build (it shouldn't, since tests live elsewhere).

## Workspace wiring

1. `pnpm-workspace.yaml` already globs `packages/*`, so no manual registration is needed — just run `pnpm install` after adding the package so the lockfile/workspace picks it up.
2. Add `packages/*/dist/` to the root `.gitignore` under the `# Build` section if not already present (it should be, alongside `applications/*/dist/`). Never commit `dist/`.
3. The root `turbo.json` already defines a `build` task with `outputs: ["dist/**"]` — no per-package turbo config needed.

## Validation

Run after scaffolding or changing a package:

```sh
pnpm install
npx tsc -p packages/glacier-<name>/tsconfig.json --noEmit
npx turbo run build --filter=@glacier/<name>
oxlint packages/glacier-<name>
```

All four must pass cleanly (no type errors, successful build producing `dist/index.js` + `dist/index.d.ts`, no lint findings) before considering the package ready.
