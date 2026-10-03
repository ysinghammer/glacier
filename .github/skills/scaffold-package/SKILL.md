---
name: scaffold-package
description: Scaffold a Glacier library, React application, or microservice with the current ADRs, package conventions, and initialized workspace tooling.
---

Create a minimal working package, not a speculative architecture skeleton. This is an agent-driven workflow: inspect the
current repository and generate appropriate files rather than relying on frozen templates.

## Interview and identity

1. First ask the user for the package type, with exactly these choices: `library`, `application`, `microservice`.
2. Next ask for the unprefixed package name. Accept lowercase kebab-case matching `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`.
   Reject paths, scoped names, and names already prefixed with `glacier-`; explain the problem and ask again rather than
   silently normalizing input.
3. Derive identity and location from the answer:

   | Type           | Directory                           | npm `name`        |
         |----------------|-------------------------------------|-------------------|
   | `library`      | `packages/libraries/glacier-<name>` | `@glacier/<name>` |
   | `application`  | `packages/apps/glacier-<name>`      | `@glacier/<name>` |
   | `microservice` | `packages/services/glacier-<name>`  | `@glacier/<name>` |

   Set `package.json` to `"version": "1.0.0"` and `"private": true`. The directory name and scoped npm identity are
   distinct; do not add a separate scope field or alias.
4. For a library, subsequently ask for its target: backend/Node.js, frontend/React, or technology-independent
   TypeScript. An `application` is a React frontend; a `microservice` is a Node.js HTTP service.

Use `ask_user` for decisions, one question at a time. Type and name remain the first two prompts. Do not ask users for
facts that can be established from repository files.

## Architectural and workspace preflight

Before any repository change:

1. Read `.docs/Home.md`, `.docs/Architecture/Decisions/Index.md`, and every accepted, active ADR in that directory. Read
   the architecture index and applicable linked techstack, dependency, and code-style notes. Resolve the actual indexed
   paths; do not assume ADR filenames or hard-code a fixed inventory.
2. Inspect the root manifest, pnpm workspace configuration, lockfile, Turbo configuration, shared TypeScript/lint/format
   configuration, relevant existing packages, and CI/security configuration. Establish package scripts, module format,
   tool versions, build outputs, test conventions, and workspace discovery from those sources.
3. Require an initialized pnpm/Turbo workspace and the applicable shared build, type-check, lint, formatting, testing,
   and CI/security infrastructure. Missing shared infrastructure is a blocker: identify the missing files, tools, or
   setup and stop with actionable guidance. Do not initialize root tooling, create shared CI from scratch, or provision
   external integrations.
4. Use the tool choices required by active ADRs and their linked notes. Reuse compatible established workspace
   configuration. If an essential implementation choice is neither documented nor established, stop and identify the
   missing architectural decision; do not choose a frontend build tool or HTTP framework ad hoc. Future ADRs take effect
   on the next invocation without changing this skill.
5. Check that the destination does not already exist and that the scoped npm name is not already used anywhere in the
   workspace. Treat either collision as a blocker, including an empty destination directory. Do not overwrite or merge
   into an existing package.
6. Invoke `implementation-branching` and obtain the user's branch decision before any edit, generation, install, or
   other repository mutation. Preserve existing staged, unstaged, and untracked work. If changes conflict with the
   scaffold, ask how to proceed; never stash, reset, discard, or move them without permission.

ADRs remain authoritative. If the requested scaffold conflicts with a decision, stop and explain the conflict; do not
silently amend an ADR or disregard it.

## Dependencies and proposed changes

Before writing files, describe the concrete package starter, files, necessary workspace integration edits, and exact new
direct dependencies with their runtime/development placement and versions.

- Obtain explicit approval for every new direct dependency declaration, including packages already listed as approved in
  the dependency tables or used by another workspace package. Approval of this skill is not blanket dependency approval.
  Use compatible existing version conventions and the applicable approved dependency scopes.
- If a needed dependency is not covered by the approved tables, stop for explicit approval and reconcile directly
  affected dependency notes before adding it. Approval does not authorize a conflicting architectural choice. Transitive
  dependencies do not need separate approval.
- Reuse shared tooling instead of duplicating root development dependencies in every package. Use `workspace:`
  references for deliberate local package dependencies according to repository conventions, and obtain approval for
  those new direct dependencies too.
- Use package-manager commands to update manifests and the lockfile where practical, and `apply_patch` for manual files.
  Install or restore dependencies only after approved manifest changes or a validation failure establishes a missing
  dependency.
- Select applicable Node.js LTS and tool versions from current ADR requirements and compatible workspace configuration;
  do not freeze a release number in this skill.

## Package contents

For every type, provide a valid manifest, applicable TypeScript/build configuration, scripts integrating with existing
Turbo tasks, appropriate ignore rules, and a concise package README covering purpose, public entry points, commands, and
prerequisites. Reuse shared configuration rather than copying it. Scripts must execute real checks; do not add
successful no-op test scripts.

Organize code capability-first, then by meaningful layers. Add only layers with an actual responsibility. Do not
manufacture domain entities, ports, repositories, fake business capabilities, generic shared buckets, or a full empty
folder tree. Do not add PostgreSQL, Drizzle, Redis, or other optional integrations to a technical starter.

### Libraries

- Place the deliberately curated public barrel at package-root `index.ts`, outside `src/`. A new library may start with
  an empty module barrel; do not invent an example API just to fill it.
- Configure an export map exposing only `"."`, with runtime and type targets matching actual build output. No public
  subpaths or deep imports. Ensure the root barrel is included in compilation.
- For a single capability, place applicable layers directly under `src/`; add capability directories only when multiple
  real capabilities exist.
- Frontend libraries place actual React components and hooks in `presentation/`; neutral libraries must not gain
  Node-specific or React dependencies without need.
- Include no `Application.bootstrap.ts`, `bootstrap/` layer, or import-time resource startup. Future integration must
  use explicit factories, registration, or lifecycle APIs through the public barrel.
- Validate compilation, type declarations, and the export map/build-output agreement. Configure library-only Vitest
  tests through the package-root public API, not internal imports, with V8 coverage enforcing 100% statements,
  branches, functions, and lines both per library and per relevant production file. Include untested production files
  implementing or supporting public runtime exports; do not measure only the barrel or exclude executable paths.
  Test every public runtime export's applicable behavior and verify type-only public contracts through type-checking.
  Wire coverage-enforcing test tasks into existing Turbo and CI conventions. For an empty barrel, report that there
  are no public exports to test yet; do not invent APIs or claim coverage from a successful no-op test task.

### React applications

- Provide a minimal runnable page and real React mounting in presentation code.
- Start through `src/Application.bootstrap.ts`, containing only minimal delegation. Put substantial supporting
  composition in `src/bootstrap/` when needed; JSX and UI composition belong in presentation code, not the `.ts` entry.
- Follow documented build/dev/serve conventions. Include the container definition or reuse the established container
  setup needed to run the real frontend in Testcontainers; this does not prescribe a production hosting platform.
- Provide a Playwright smoke test through the running application's public UI. Start the real target with
  Testcontainers, without mocked infrastructure.

### Microservices

- Provide a minimal HTTP service with a public health endpoint following the documented service conventions.
- Start through minimal `src/Application.bootstrap.ts`; place supporting composition/lifecycle code in `src/bootstrap/`
  and HTTP implementation in the applicable inbound adapter location. Do not put transport logic in domain/application
  code.
- Explicitly select implementations. Separate construction from startup, surface startup errors, clean up resources
  already started after partial failure, and shut down dependents before dependencies. Use established lifecycle APIs
  and shutdown policies; do not invent a framework.
- Provide a Dockerfile producing a runnable service image with the documented Node.js LTS and workspace packaging
  conventions.
- Provide a Playwright smoke test through the public HTTP API of the real service started by Testcontainers. Use public
  readiness checks, reliable container cleanup, and real infrastructure if later required.

For both runnable types, keep starter behavior technical rather than adding product functionality. Tests must obey the
current ADRs' public UI/HTTP boundaries.

## Workspace integration and verification

1. Prefer existing glob-based package discovery and shared Turbo/CI conventions. Make only necessary registration or
   integration edits to existing workspace configuration and CI/security checks. Preserve existing settings; do not
   expand this task into foundational tooling setup.
2. Keep Snyk and Renovate as GitHub integrations, not direct npm dependencies. If external integration readiness cannot
   be established, report it as an unresolved prerequisite rather than claiming it was provisioned.
3. Install approved dependencies with pnpm and update the existing lockfile. Run the smallest existing Turbo commands
   covering the new package's build, type checks, lint, and formatting checks, plus relevant affected integration
   checks.
4. Run application/service smoke tests through Playwright and Testcontainers. Verify required Docker availability and a
   service's image build and actual startup. Do not substitute a locally launched or mocked test target for the required
   containers. For libraries, run Vitest with coverage through Turbo and verify all public exports and the required
   100% thresholds; do not apply Vitest to applications or microservices.
5. Verify exact metadata, directory placement, script/task wiring, bootstrap or library export constraints, generated
   output, dependency approval, and conformance with every accepted, active ADR. Fix problems caused by this scaffold
   without changing unrelated work.
6. Missing Docker, unavailable dependencies, failed builds/checks, or incomplete workspace wiring are blockers, not a
   completed scaffold. Preserve user changes and report any generated files left behind, the failed check, and the next
   required action. Do not mask failures, broadly catch them, or insert success-shaped fallbacks.
7. Inspect the final diff and summarize the created package, meaningful integration changes, and any blockers. Do not
   commit, push, or open a pull request unless separately requested.
