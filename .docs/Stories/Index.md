# Stories

[ADR-0008: Story documentation](../Architecture/Decisions/ADR-0008-Story-documentation.md) defines a story as one coherent, independently
reviewable outcome with explicit scope and verifiable acceptance criteria. Stories may span packages and include
technical, documentation, tooling, or refactoring work; a product user-story sentence is optional. Unrelated outcomes
belong to separate stories. Every repository change requires a proportionate story.

## Document contracts

Use a short, stable, lowercase kebab-case folder slug with exactly three story documents:

| Document   | Owns                 | Required content                                                                                                                                                                                               |
| ---------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Brief.md` | Why and what         | Problem/audience, intended outcome, scope/non-goals, requirements/constraints, acceptance criteria, open questions, references, related notes.                                                                 |
| `Plan.md`  | How and verification | Approach/alternatives, affected areas/interfaces, ordered implementation steps, data/lifecycle/failures, validation, E2E tests, dependencies/risks/open decisions, migration/rollout, approval, related notes. |
| `Tasks.md` | Execution            | Stable task IDs, actions, status, source references, dependencies, completion conditions, evidence, blockers, and applicable workflow gates.                                                                   |

Keep template sections and use concise content or justified inapplicability. Plans must map every criterion to a
verification method. Use stable story-local IDs such as `AC-001`, `P-001`, and `T-001`; do not renumber or reuse them.
Reference the story with local IDs when linking from elsewhere. Task statuses are `pending`, `in_progress`, `blocked`,
and `done`; blockers must be explicit, dependencies acyclic, and done tasks supported by evidence.

Do not duplicate requirements in the plan, design in tasks, or a single overall status in all three documents.
Record the user's joint approval of the plan and brief criteria in `Plan.md`; link to it from the brief and tasks.
Unapproved drafts and bounded unknowns must be explicit. Material requirement/design changes invalidate affected
approval until renewed; implementation corrections preserving approved behavior and approach do not.

## Skills and authoring

- `documentation-brief` creates or revises the requirements contract.
- `documentation-plan` creates or revises design and verification from a sufficiently settled brief.
- `document-tasks` derives actionable records from a sufficiently concrete plan.

There is no required `documentation-story` coordinator skill. Each skill edits only its document, verifies repository
facts, and asks about decision-critical gaps. It flags contradictions and needed companion updates rather than silently
rewriting other artifacts. Drafting may precede approval; invocation does not approve requirements or authorize code
implementation, commits, publication, or merge. Full grilling interviews are not automatic.

Discovery may be read-only. Create the story branch from freshly fetched `origin/main` before writing its notes;
confirmed in-flight stories adopt remaining gates without inventing earlier branching or approval evidence.
Subsequent tasks reuse the story branch. Obtain explicit approval of the plan and criteria before implementation.

For Obsidian authoring, create `Stories/<story-slug>/` and its three notes, then run **Templates: Insert template** in
each note using **Story Brief**, **Story Plan**, or **Story Tasks**. Replace title prompts and fill in links. The built-in
plugin inserts content; it does not create the folder or three files. See [Templates](../Templates/Index.md).

## Acceptance and test traceability

Application/service acceptance criteria follow [ADR-0007](../Architecture/Decisions/ADR-0007-Acceptance-catalog.md).
Draft proposed additions, modifications, or removals in the brief using stable catalog criterion IDs, Given/When/Then
public behavior, feature/API IDs, and source references. The user approves these with the plan before implementation.
Register approved changes in `tests/acceptance/` before feature work. The catalog is the durable current baseline;
briefs preserve proposals and rationale, not a duplicate current baseline. Preserve IDs and unaffected regression
criteria; behavior changes/removals require renewed approval.

Every plan retains `E2E tests`. Application/service changes identify catalog feature/API, criterion, and scenario IDs,
describe scenarios, and name intended Playwright files under `tests/scenarios/<capability>/`. Before completion,
link to actual implemented tests and catalog entries using relative links, retaining scenario IDs. Do not link planned
paths as if implemented or duplicate the catalog's derived reverse mappings.

Documentation-only, tooling-only, and library-only stories retain local criteria in the brief, explain E2E
inapplicability, and describe applicable verification in `Validation`. Do not invent application business criteria.

## Active stories

- [Glacier reflection](glacier-reflection/Brief.md) - independent typed metadata library;
  [plan](glacier-reflection/Plan.md) and [tasks](glacier-reflection/Tasks.md).

The [initialize-workspace story](../Archive/initialize-workspace/Brief.md) is archived for pre-review
preparation; its [remaining workflow gates](../Archive/initialize-workspace/Tasks.md) are not completed.

## Closure

Before final PR review, transfer lasting guidance to the relevant Engineering or Architecture note and move
the story folder to `Archive/`. Update indexes, relative links, and affected catalog source references without changing
IDs or moving current criteria out of the catalog. Archival location means pre-merge preparation, not confirmed delivery.
The final merge task stays pending until GitHub confirms a merge commit into `main`; no follow-up documentation commit
is required solely to mark that confirmation. Commit, publication, human acceptance, and merge gates remain separate.
