---
name: implementation-publish-pr
description: Push the story branch and open or update its GitHub PR with a compliant description after explicit publication authorization, per ADR-0006. Does not merge.
---

Follow `.docs/Architecture/Decisions/ADR-0006-Workflow.md`. Precondition: implementation, local verification
(`implementation-verification`), closure (`implementation-closure`), and authorized package-scoped commits are done.

1. Ask for explicit authorization to push and open a PR targeting `main`. Plan approval, commit authorization, or
   completion never substitutes. If declined, stop; do not ask again unless the user initiates.
2. On approval, push the story branch (never force-push) and create the PR with `create_pull_request`; for later
   revisions update the same PR and obtain commit/push permission first.
3. PR description must: summarize the change, link the story, list validation run and applicable limitations, and make
   architectural, dependency, and behavioral changes visible (new dependencies, ADR changes, criterion changes).
4. Give the user the PR URL. Report push or creation failures plainly; never present them as success.

Publication does not authorize merging; continue with `review-merge` only when the user initiates it.
