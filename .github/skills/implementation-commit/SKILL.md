---
name: implementation-commit
description: Format and split implementation commits by package using Conventional Commits and Semantic Versioning. Use whenever preparing or creating commits in this monorepo.
---

Before committing, identify the package that owns each changed file. Use the package's declared name as the commit scope, or `workspace` for changes to the monorepo itself, such as root configuration, global documentation, and shared CI. Do not use `workspace` for a package change merely because it affects other packages.

Write each commit subject as `<type>(<scope>): <imperative summary>`. The scope is required and must be **exactly one** package name or `workspace`; do not combine package names in one scope. Choose the type and release impact according to Conventional Commits:

- `fix` for a bug fix (SemVer patch).
- `feat` for a new feature (SemVer minor).
- Add `!` before `:` and a `BREAKING CHANGE: <description>` footer for an incompatible change (SemVer major), regardless of type; for example, `feat(package-a)!: remove legacy endpoint`.
- Use `docs`, `ci`, `chore`, `refactor`, `test`, or another appropriate type for other work. These do not imply a version bump unless marked as breaking; do not label a change `feat` or `fix` solely to force a bump.

Split changes touching multiple packages into separate commits, one per package, even if they implement one feature. Put changes to the monorepo itself in their own `workspace` commit. Stage only the files or hunks belonging to the intended scope and check the staged diff before each commit; never sweep unrelated changes into a commit.

For example, changes to package `package-a`, package `package-b`, and root CI require three commits:

```
feat(package-a): add export endpoint
feat(package-b): consume export endpoint
ci(workspace): update shared pipeline
```
