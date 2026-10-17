---
name: glacier-commit
description: Create a new commit following the conventional commit format. Use when the user wants to make a commit, or uses any 'commit' trigger phrases.
---

# glacier-commit

Creates commits that satisfy the repository's commitlint rules (`commitlint.config.ts`, enforced by the `.husky` commit-msg hook).

## Preconditions

1. Commit only with explicit user authorization (or an approved task/story plan that authorizes it). Without
   authorization, stop and ask; never treat absent authorization as consent.
2. Read the policies in `.policies/` and inspect `git status` and `git diff` before staging.
3. Work on the change's integration branch named `<type>/<lowercase-kebab-description>` where type is `feature`,
   `bugfix` or `chore` (never `bugifx` or new `refactor/` branches). Never commit on `main`.
4. In a shared checkout only one agent stages and commits at a time. Concurrent agents use isolated worktrees.
5. Stage only files owned by the task. Never stage unrelated or user changes, and never use `git add -A` blindly.
6. Never commit anything under `.plan/` (EPIC, stories, tasks, approvals, evidence). It is ignored and local-only.
   Never force-add it or copy plans into tracked files. If tracked plans are found, stop and ask the user.
7. Run `pnpm run ci` (no cached results for story/epic gates: `pnpm exec turbo run ci --force`) and make sure it
   passes before committing. Record exact commands and results; never hide or claim failing checks as passing.

## Commit granularity

- One commit per logical group of changes.
- Each task produces its own product-change commit.
- Each story ends with a story completion commit that records the evidence in its body. If no owned tracked change
  remains, use an explicitly authorized empty commit with `task-000`:
  `git commit --allow-empty`.
- `task-000` is reserved for story integration/completion, never for an implementation task.
- Local status updates in `.plan/` never replace task or story commits.
- Preserve task/story commit history on integration; do not squash it away or rewrite existing commits.
- Never bypass hooks (`--no-verify`, `HUSKY=0`).

## Subject format

```text
<type>(<scope>): story-<NNN> task-<NNN> <imperative lowercase description>
```

- **type**: a Conventional Commit type from `@commitlint/config-conventional`: `feat`, `fix`, `docs`, `style`,
  `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **scope**: mandatory and exactly one. Either `workspace` (changes no single package owns, tooling, docs, policies,
  skills) or a package directory name without the `glacier-` prefix (e.g. `packages/libraries/glacier-reflection`
  → `reflection`). Never use several scopes or the delimiters `,` `/` `\`. The valid list is derived from
  `pnpm-workspace.yaml`; check `commitlint.config.ts` if unsure.
- **story/task references**: lowercase, zero-padded, three digits, e.g. `story-001 task-002`. Canonical plan IDs
  stay uppercase (`STORY-001/TASK-002`) inside plans only, not in the subject.
- Keep the whole header within commitlint's limit (100 characters by default), no trailing period, lowercase
  description.

Examples:

```text
feat(reflection): story-001 task-002 add public metadata lookup
chore(workspace): story-001 task-000 record story completion
```

## Body format

Separate the body from the subject with a blank line and wrap lines at 100 characters or fewer. The body MUST:

- Explain the meaningful changes (what and why), not just restate the subject.
- Report criterion results: which story/task acceptance criteria pass.
- List the exact verification commands run and their pass/fail results (e.g. `pnpm run ci`,
  `pnpm exec turbo run ci --force`), including relevant counts.
- State known limitations and anything not done or not claimed (for example no push, PR or remote CI).
- For story completion commits, reference the verified task commits and prerequisite story commit hashes, and state
  when the commit is an authorized empty completion record that adds no product delta.
- Contain no secrets and no tracked-planning content; evidence lives only in the commit body and ignored local plans.
- Finish with the required agent attribution trailer after a blank line, e.g.:

  ```text
  Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>
  ```

  Use the attribution trailer required for the current agent/host if it differs.

## Procedure

1. `git status` and `git diff` to confirm exactly what belongs to the task; leave unrelated changes untouched.
2. Run `pnpm run ci` and fix failures before committing.
3. Stage only the owned files (`git add <paths>`).
4. Compose the subject and body per the formats above, using a file or heredoc for multi-line messages:

   ```sh
   git commit -F <message-file>
   ```

   Put temporary message files in `.plan/`, never in tracked locations.

5. If the commit-msg or pre-commit hook fails, fix the cause and create the commit again; do not bypass hooks.
6. Verify with `git log -1 --stat` that the commit contains only the intended files and no `.plan/` content.
7. Record the actual commit hash in the ignored local story/task evidence, kept distinct from plan snapshot
   identifiers.

## Out of scope

Committing does not authorize pushing, force-pushing, opening a PR, cleanup of `.plan/`, or merging. Each requires
its own explicit user authorization (policy 0013, items 21–28).
