---
name: implementation-main-sync
description: Integrate freshly fetched origin/main into the story branch by merge (never rebase) and renew checks and acceptance, per ADR-0006. Use before final validation or merge.
---

Follow `.docs/Architecture/Decisions/ADR-0006-Workflow.md`.

1. `git fetch origin main`; check the working tree is clean and whether the branch already contains `origin/main`
   (`git merge-base --is-ancestor origin/main HEAD`). If it does, record that and stop.
2. Otherwise obtain authorization, then `git merge origin/main` into the story branch. Never rebase or rewrite
   published history.
3. Resolve conflicts without weakening approved behavior, criteria, catalog entries, or tests. Ask the user when a
   resolution would change approved behavior.
4. Rerun applicable local checks (`implementation-verification`) and require CI to pass. Commits and pushes need
   their own authorization.
5. Any new PR revision, including this merge, invalidates acceptance and merge approval of the previous revision;
   renew both via `review-merge`.
6. Immediately before merging, fetch again; if main moved, repeat this loop.
