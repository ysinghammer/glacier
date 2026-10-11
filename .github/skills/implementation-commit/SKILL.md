---
name: implementation-commit
description: Format and split implementation commits by package using Conventional Commits and Semantic Versioning. Use whenever preparing or creating commits in this monorepo.
---

Follow `.docs/Architecture/Decisions/ADR-0006-Workflow.md`. Obtain explicit commit authorization after implementation
and applicable local verification; plan approval does not authorize commits. Resolve applicable pre-commit failures
without bypassing hooks. Commit authorization does not authorize pushing, opening a PR, or merging.

Before committing, identify the package that owns each changed file. Use the package's directory name without the `glacier-` prefix as the commit scope (for example `reflection` for `packages/libraries/glacier-reflection`), or `workspace` for changes to the monorepo itself, such as root configuration, global documentation, and shared CI. Do not use `workspace` for a package change merely because it affects other packages. The allowed scopes are derived from the workspace package directories by `commitlint.config.ts`; the Husky `commit-msg` hook and CI reject any other scope.

Write each commit subject as `<type>(<scope>): <imperative summary>`. The scope is required and must be **exactly one** package scope or `workspace`; do not combine scopes (no `,`, `/` or `\` separators). Choose the type and release impact according to Conventional Commits:

- `fix` for a bug fix (SemVer patch).
- `feat` for a new feature (SemVer minor).
- Add `!` before `:` and a `BREAKING CHANGE: <description>` footer for an incompatible change (SemVer major), regardless of type; for example, `feat(package-a)!: remove legacy endpoint`.
- Use `docs`, `ci`, `chore`, `refactor`, `test`, or another appropriate type for other work. These do not imply a version bump unless marked as breaking; do not label a change `feat` or `fix` solely to force a bump.

Split changes touching multiple packages into separate commits, one per package, even if they implement one feature. Put changes to the monorepo itself in their own `workspace` commit. Stage only the files or hunks belonging to the intended scope and check the staged diff before each commit; never sweep unrelated changes into a commit. Commit `pnpm-lock.yaml` changes together with the manifest change that caused them, in that manifest's commit.

For example, changes to the package directories `glacier-package-a` and `glacier-package-b` and to root CI require three commits:

```
feat(package-a): add export endpoint
feat(package-b): consume export endpoint
ci(workspace): update shared pipeline
```
