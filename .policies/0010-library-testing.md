# 0010 — Library testing

1. Backend, frontend, and technology-independent libraries MUST use Vitest with package-local `tests/` for test code/data/doubles/support. Runtime scenarios MUST live under `tests/scenarios/`; multi-capability libraries MUST group by public capability, not implementation layers. Optional directories MUST exist only when needed.

| Package-local path                                              | Ownership/discovery                                     |
| --------------------------------------------------------------- | ------------------------------------------------------- |
| `vitest.config.ts`                                              | Package-root configuration                              |
| `tests/scenarios/**/*.test.ts`, `tests/scenarios/**/*.test.tsx` | Only ordinary runtime discovery; JSX uses `.tsx`        |
| `tests/contracts/**/*.test-d.ts`                                | Public type-contract checks; type-check only            |
| `tests/data/`                                                   | Technical input cases                                   |
| `tests/doubles/`                                                | Publicly injected test-owned dependencies               |
| `tests/artifacts/`                                              | Generated results/coverage only, Git/discovery-excluded |

2. Tests MUST consume only the package-root public API, never internals/public subpaths or private state, except for the explicit public `@glacier/reflection/register` entry and its generated/source public-entry equivalents when verifying registration. This narrow exception MUST NOT expose private adapters/state or permit other subpaths. Internal symbols MUST NOT be exported solely for testing. The only other direct-file exception is a `.stories.tsx` importing its documented component and that component's siblings.
3. Every non-component public runtime export MUST have meaningful observable assertions for applicable success, failure, and boundary behavior; component exports are tested by their required stories. Tests MUST name technical scenarios with explicit setup, action, and expected outcomes. Libraries MUST document representative public API usage examples; examples/full coverage MUST NOT replace assertions. Libraries need not use application business datasets or acceptance journeys.
4. Test-owned dependency implementations MAY be supplied only through public injection points. Module mocks and private/internal inspection to force coverage MUST NOT be used. Hooks MUST use jsdom and Testing Library `renderHook`, not React module mocking. Non-React libraries MAY use the library-wide Vitest Playwright browser provider for public contracts; this does not authorize React-only integrations or application/service unit tests.
5. Vitest MUST use `@vitest/coverage-v8` and enforce 100% statements, branches, functions, and lines both per library and per production file implementing/supporting public runtime exports, including reflection's explicit `register.ts` and its supporting runtime files. Collection MUST include relevant untested supporting files, not merely loaded modules/barrels. Executable paths MUST NOT be excluded or hidden with coverage-ignore annotations. Node and browser coverage, including story-run projects, MUST be combined for thresholds.
6. Type-only exports MUST be verified through public type-contract checking, not runtime discovery/coverage. Erased types MUST NOT be described as runtime-covered; passing runtime tests MUST NOT replace type-checking.
7. Library test tasks MUST collect coverage through pnpm/Turborepo locally/CI and fail unmet thresholds.
8. Authored support MUST stay outside `artifacts/`; generated library results MUST stay under package-local `tests/artifacts/`, ignored by Git/test discovery and secret-safe.
