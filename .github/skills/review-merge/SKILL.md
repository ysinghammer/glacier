---
name: review-merge
description: Obtain separate PR-publication and merge permissions; require current-main integration, checks, and human acceptance before GitHub merge into main.
---

Follow `.docs/Architecture/Decisions/ADR-0006-Workflow.md`.

After implementation, required local verification, story/archive preparation, and explicitly authorized
package-scoped commits, ask whether the user authorizes pushing and opening a PR to `main`. This is publication
permission, not merge permission. Do not treat plan approval, completion, or commit authorization as either.

On publication approval, push the story branch and create its GitHub PR using the app's `create_pull_request` tool.
Include a brief change summary, story link, validation, and relevant limitations. Give the user the PR URL.
For subsequent revisions, obtain required commit/push permissions and update the same PR rather than create another.
Report publication failures explicitly.

Before final validation and merge, freshly fetch `origin/main` and ensure the story branch contains it. If not, merge
`origin/main` into the story branch with authorization, resolve conflicts without weakening approved criteria, and
repeat applicable local checks and independent CI. Do not rebase published history. Missing or failed applicable
checks, unresolved findings requiring action, and blocking feedback prevent acceptance.

Require explicit human acceptance of the current revision, including criteria, assertion quality, every active ADR,
dependency approvals, and documentation. Maintainer self-review is allowed; AI review is optional and cannot replace
the human gate. New changes invalidate prior acceptance and merge permission; renew both after checks pass.

After acceptance and passing checks, obtain explicit authorization to merge the current revision. One explicit human
decision may grant both acceptance and merge permission for an unchanged revision. Check main freshness and revision
identity again; if either changed, return to integration, checks, and acceptance.

Merge using GitHub's merge-commit method to preserve package-scoped commits. Confirm GitHub reports the PR merged
into `main` before reporting completion; a closed PR or attempted merge is not confirmation. No release, deployment,
or continuous-delivery step belongs to this workflow.

If the user declines publication or merge, stop that stage. Do not ask repeatedly or resume automatically; proceed
only when the user later initiates it. Never describe approval to open a PR as approval to merge it.
