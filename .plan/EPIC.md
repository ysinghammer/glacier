# Workspace conformance cleanup

## Problem and business value

The workspace audit found an incomplete migration from deleted documentation and
typed acceptance inventories to the current policies. Contributors need reliable,
truthful verification and documentation without obsolete requirements or lost
diagnostics.

## Users and intended outcomes

Contributors and maintainers can follow current documentation, author approved
scenarios, and rely on failures being reported rather than hidden or misclassified.

## Scope and non-goals

Correct every confirmed audit defect in acceptance tooling, documentation checks
and references, report retention, naming, reflection test support and callbacks,
and stale editor mappings. Investigate reported reflection lifecycle risks and
fix confirmed causes with regression evidence.

Do not simplify mandatory workflow policies or routine verification gates, add
runtime dependencies, change reflection public behavior, manufacture application
products or business scenarios, remove unrelated local artifacts, or publish.
Optional speculative performance optimizations are excluded.

## Requirements and acceptance criteria

- AC-001: No authored `tests/acceptance/` remains. Capability Markdown owns
  application/service criteria; validation derives mappings and rejects the
  documentation/discovery failures required by policy 0012.
- AC-002: Documentation verification covers current relevant Markdown, including
  policies, root/package READMEs, and existing planning files. Obsolete story
  structures and unsupported size limits are not enforced. Current workflow
  documents and IDs are verified with positive and negative controls.
- AC-003: Documentation and the PR template contain no known obsolete references
  or false claims about existing packages, execution, coverage, or missing ADRs.
- AC-004: Report retention preserves other report kinds within a shared invocation
  and does not delete active invocation evidence. Regression controls demonstrate
  preservation and intended bounded retention.
- AC-005: Confirmed reflection support lifecycle defects are fixed without losing
  primary or cleanup failures. Startup and cleanup regression checks establish
  reliable behavior while existing public runtime/type contracts remain intact.
- AC-006: Identified naming, substantial callback, and missing support JSDoc
  violations are corrected without artificial layers or reduced assertions.
- AC-007: Obsolete tracked IDE mappings to nonexistent packages are removed.
- AC-008: Applicable uncached workspace gates pass using Node 24.21.0 and pnpm
  11.9.0, retaining exact commands, outcomes, and limitations.

## Constraints and preserved behavior

Existing workflow policies and required gates remain unchanged. Preserve reflection
runtime exports, type contracts, approved activation effects, and dependency scope.
No new direct dependency is authorized. No push, PR, automatic publication, or
rewriting existing commits is authorized.

## Scenario proposals

Application/service E2E journeys are inapplicable: there are no application/service
packages or behavior changes. Use story-local tooling/library criteria and
technical fixtures; do not add invented business scenarios.

## Open questions and decisions

- The user chose "Fix all concrete defects; preserve current workflow policies
  (Recommended)".
- The user directed "Use the curent branch"; retain `feature/glacier-reflection`
  rather than create or switch branches. This explicit host-level direction
  constrains the workflow branch prerequisite.
- The user selected "Authorize workflow commits on the current branch".
- The working tree was clean at revision `ef461a0` before this cleanup.
- Node 24.21.0 is installed under the user's nvm versions directory.
- Technical contracts, story decomposition, and task/resources await their
  separate approvals in fresh contexts.

## User approval

The user selected "Approve the epic and acceptance criteria" after presentation
of the complete cleanup outcomes, exclusions, branch/commit constraints, and
validation obligations on 2026-10-11.
