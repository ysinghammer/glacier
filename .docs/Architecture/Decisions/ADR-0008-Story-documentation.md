---
status: accepted
created: 2026-10-03
tags:
  - ADR
---

# ADR-0008: Story documentation

## Context

[ADR-0006](ADR-0006-Workflow.md) defines the delivery workflow in which every repository change belongs to a story. This
decision defines what a story is, how its three documents divide ownership, and how the authoring skills behave. It was
extracted from ADR-0006 because the document model changes for different reasons than the workflow gates.

Stories need distinct requirements, design, and execution contracts rather than three overlapping descriptions of the
same work. One coherent outcome is chosen over an initiative containing unrelated deliverables. Technical and
documentation outcomes qualify without an artificial user-story sentence. Three document-specific skills are chosen
over a coordinator skill so contributors can revise one artifact without implicitly authorizing downstream work.
Structured tasks make dependencies, blockers, and completion evidence explicit; detail remains proportionate.
An explicit numbered wave sequence makes worker counts and file/resource ownership reviewable before execution.

## Decision

### Story meaning and document ownership

- A story must represent one coherent, independently reviewable outcome with explicit scope and verifiable acceptance
  criteria. It may span packages and contain multiple tasks. Unrelated outcomes must become separate stories rather
  than share a story branch. Technical, documentation, tooling, and refactoring outcomes must qualify; a product
  user-story sentence must not be required.
- Each story must use a short, stable, lowercase kebab-case folder slug under `.docs/Stories/`, with exactly three
  story documents named `Brief.md`, `Plan.md`, and `Tasks.md`. Supporting references may be linked, but a separate
  story metadata or coordinator document must not be required.
- `Brief.md` must own why and what: the problem and audience, intended outcome, scope and non-goals, requirements and
  constraints, acceptance criteria, open questions, and references. It must describe required results independently of
  the chosen implementation. Applicable success, rejection, authorization, and boundary behavior must be explicit.
  Technical implementation choices must belong in the plan.
- Every acceptance criterion must have a stable ID. Application/service behavioral criteria must follow [ADR-0007](ADR-0007-Acceptance-catalog.md)'s
  global catalog identity and lifecycle rules. Other criteria must use story-local IDs such as `AC-001`, which must be
  referenced with their story when used outside it. IDs must not be renumbered or reassigned to unrelated criteria.
  Acceptance criteria must define objectively verifiable results, not merely task completion.
- `Plan.md` must own how: approach and material alternatives; affected packages, documents, and interfaces; ordered
  implementation steps and dependencies; applicable data, lifecycle, and failure handling; validation; E2E tests;
  dependencies, risks, and unresolved decisions; migration and rollout; and approval. Steps must have stable story-local
  IDs such as `P-001` so tasks can reference them without copying the design.
- Each acceptance criterion must map to a verification method in the plan. This mapping must not duplicate [ADR-0007](ADR-0007-Acceptance-catalog.md)'s
  catalog-derived feature/API-to-scenario-to-test reverse mappings. Relevant contracts, failure paths, prerequisites,
  sequencing, migration, and rollout must be specified sufficiently for execution. File-by-file instructions must not
  be required when they add no clarity.
- The brief and plan must retain the sections in their respective [templates](../../Templates/Index.md), using concise
  content or an explicit reason for inapplicability rather than invented requirements or empty sections. Open-question
  sections must state when none remain. Material unknowns must be resolved or explicitly bounded in the approved scope
  before implementation; an unbounded decision affecting acceptance or approach must block approval.
- `Tasks.md` must own execution rather than redefine requirements or design. Each task must have a stable story-local
  ID such as `T-001`, a concrete action, status, source reference to a plan step, acceptance criterion, or applicable
  workflow gate, explicit task dependencies, an objectively checkable completion condition, and evidence when done.
  Empty dependencies must be recorded as none. Task IDs must not be renumbered or reused for unrelated work.
- Task status must be one of `pending`, `in_progress`, `blocked`, or `done`. A blocked task must identify its blocker;
  a done task must identify the result, observed verification, or explicit authorization satisfying its completion
  condition. Pending work must not be represented as completed, and genuinely inapplicable gates must record their
  rationale rather than claim a check ran. Dependencies must be acyclic and satisfied before dependent execution.
- Tasks must include applicable discovery, approval, implementation, verification, closure preparation, commit,
  publication, current-main integration, human acceptance, and merge gates. A task must not introduce a requirement
  or materially change the approved approach; those changes must return to the brief/plan approval gate.
- Tasks must retain an `Execution sequence` table with ordered stable wave IDs, task IDs, exact concurrent worker
  counts, prerequisites, owned files/resources, and safe-parallel or serial rationale. Each actionable task must occur
  exactly once in the remaining planned sequence; completed historical tasks must retain evidence and historical
  sequence rows rather than imply future execution. Attempts must be logged in task evidence without changing IDs.
- Human-gate rows must specify zero workers while waiting and a fresh one-worker verification after authorization.
  Dependency readiness and earlier completion must be checked at dispatch; a whole-wave barrier must be allowed.
  Independent ready scopes alone must justify parallelism, not an assumption that all tasks run concurrently.
  Shared Tasks updates must serialize under one writer. Runtime restrictions lowering concurrency must receive an
  explicit sequence revision by a worker; unsafe increases must not occur.
- The plan's approval record must identify the user's explicit decision, its date, the scope of the approved plan and
  brief criteria, and any explicitly bounded exclusions. The brief must link to that record rather than duplicate it.
  Undecided drafts must be clearly marked unapproved. A material requirement or design change must invalidate the
  affected approval until renewed; implementation corrections preserving approved behavior and approach must not.
- Document creation, requirements/design approval, execution readiness, archive location, and confirmed delivery must
  remain distinct. Contributors must not duplicate an overall story status across the three documents. Tasks must
  record execution progress; GitHub must remain authoritative for confirmed merge under the closure rules of
  [ADR-0006](ADR-0006-Workflow.md).

### Story documentation skills

- Story documentation must use three document-specific skills: `documentation-brief`, `documentation-plan`, and
  `document-tasks`. A `documentation-story` coordinator skill must not be required.
- Each skill must inspect repository facts, relevant guidance, all active ADRs, and related story documents before
  creating or revising its own document. Templates must define structure; ADRs must define binding policy; skills must
  define procedure without establishing competing requirements.
- `documentation-brief` must elicit decision-critical missing outcomes, scope, constraints, and criteria, and write
  implementation-independent requirements. `documentation-plan` must require a sufficiently settled brief and map
  its criteria to the design and verification. `document-tasks` must require a sufficiently concrete plan and derive
  executable tasks, dependencies, completion conditions, and applicable workflow gates from it.
- `document-tasks` must derive and validate the explicit execution sequence, counts, ownership, and dependency
  coverage. `implementation-develop` must coordinate fresh per-task attempts under ADR-0006; it must not replace the
  three document-authoring skills, invent approval, or allow main-agent repository edits.
- Skills may draft before approval, but must expose unsettled decisions and approval dependencies. They must ask only
  for decision-critical gaps not established by repository facts. They must not automatically start a full grilling
  interview; ideation-grilling or planning-grilling must remain available when needed or explicitly requested.
- Each skill must resolve contradictions with the user rather than silently overwrite another document's intent.
  Changes requiring another document update must be reported for that document's skill or explicitly authorized
  follow-up; invoking one skill must not silently rewrite the other artifacts.
- Invoking a document skill must authorize only drafting or revising that document under the approved branching and
  scope rules. It must not authorize code implementation, self-approval, commits, push, publication, or merge.

## Consequences

Wave planning and single-writer evidence updates add coordination cost but make parallel safety and actual attempts
auditable without rewriting historical execution.

Separate document ownership reduces requirements/design drift and makes partial revisions safer. Stable criteria,
plan-step, and task IDs make progress traceable, while structured task evidence adds maintenance cost. Proportionate
content and justified inapplicability keep small stories usable. The templates and three skills must evolve with this
ADR; skill invocation alone never establishes approval or completed execution.

## Related notes

- [Architecture decisions](Index.md)
- [ADR-0005: Testing strategy](ADR-0005-Testing-strategy.md)
- [ADR-0006: Workflow](ADR-0006-Workflow.md)
- [ADR-0007: Acceptance catalog](ADR-0007-Acceptance-catalog.md)
- [Stories](../../Stories/Index.md)
- [Templates](../../Templates/Index.md)
- [Archive](../../Archive/Index.md)
