---
name: implementation-branching
description: Create one story branch from current origin/main before repository edits, following ADR-0006; preserve explicitly approved in-flight work.
---

Follow `.docs/Architecture/Decisions/ADR-0006-Workflow.md`. Every new story requires one branch from freshly fetched
`origin/main` before repository edits, including its story documents. Read-only discovery may happen first. Explain the
intended branch and obtain permission before switching; do not offer direct changes to main or arbitrary branch reuse
as alternatives to this policy. Subsequent tasks reuse their story's branch, not a new branch per task.

In-flight work adopts remaining gates without fabricating historical branch creation. Confirm its story association
and resolve uncertainty with the user rather than assuming the current branch belongs to this story.

Name the branch `<type>/<short-description>`, where `<type>` is exactly `feature`, `bugfix`, or `chore`. Use a brief, lowercase, kebab-case description of the intent:

- `feature/` for new behavior or capabilities.
- `bugfix/` for correcting broken behavior.
- `chore/` for maintenance, documentation, configuration, or other non-feature work.

For example: `feature/add-export`, `bugfix/handle-empty-response`, `chore/update-dependencies`.

Check the working tree before switching branches. If existing changes, staged files, or untracked files could be carried to the new branch, overwritten, or confused with this task, ask the user how to proceed. Never stash, reset, discard, or move their work without permission. If `origin/main` is missing or the intended branch name already exists, resolve the conflict with the user rather than silently using another base or reusing a branch.

Fetch with `git fetch origin main`, then create the branch with
`git switch -c <type>/<short-description> origin/main` and confirm the active branch before changing files.
Do not push or commit unless explicitly authorized separately. Implementation starts only after the story plan and
acceptance criteria are explicitly approved.
