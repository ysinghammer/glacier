---
name: implementation-branching
description: Ask the user before any repository change whether a new branch is required. If yes, create a fresh feature, bugfix, or chore branch from main.
---

Before every repository-changing task, explicitly ask the user whether a new branch is required. Do not infer the answer from the current branch, earlier tasks, or the type of change. Do not edit, generate, stage, or commit files until the user answers.

If the user says no, make the change on the current branch without creating one. If the user says yes, create a fresh branch from the remote `main` branch before changing files, even when the current branch already has a permitted name. If the user explicitly requests a different base, follow that instruction instead.

Name the branch `<type>/<short-description>`, where `<type>` is exactly `feature`, `bugfix`, or `chore`. Use a brief, lowercase, kebab-case description of the intent:

- `feature/` for new behavior or capabilities.
- `bugfix/` for correcting broken behavior.
- `chore/` for maintenance, documentation, configuration, or other non-feature work.

For example: `feature/add-export`, `bugfix/handle-empty-response`, `chore/update-dependencies`.

Check the working tree before switching branches. If existing changes, staged files, or untracked files could be carried to the new branch, overwritten, or confused with this task, ask the user how to proceed. Never stash, reset, discard, or move their work without permission. If `main` is missing or the intended branch name already exists, resolve the conflict with the user rather than silently using another base or reusing a branch.

When a new branch is required, create it with `git switch -c <type>/<short-description> main` and confirm the active branch before changing files. Do not push or commit unless requested separately.