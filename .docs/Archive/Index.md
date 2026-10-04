# Archive

Archived stories retain their approved intent, implementation plan, and verification references. Under
[ADR-0006: Workflow](../Architecture/Decisions/ADR-0006-Workflow.md), archiving happens in the story's PR before final
review. Location alone does not establish delivery: the final merge task remains pending until GitHub confirms the PR
merged into `main`. No follow-up documentation commit is required solely to mark that confirmation.

- [Initialize workspace and CI foundation](initialize-workspace/Brief.md) -
  [plan](initialize-workspace/Plan.md) and [tasks](initialize-workspace/Tasks.md).
  Local foundation implementation is verified. Commit/publication permissions, observed CI and owner-activated
  Snyk/Renovate results, human acceptance, and confirmed merge remain outstanding; archival does not claim delivery.
