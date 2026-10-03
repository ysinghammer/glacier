---
created: {{date:YYYY-MM-DD}}
tags:
  - story
---

# [Story title] - Plan

This document owns implementation design and verification, not requirements or execution progress.
Retain each section with proportionate detail; justify inapplicability instead of inventing design.

## Approach

Describe the intended implementation and alternatives considered.
Follow [ADR-0006: Workflow](../Architecture/Decisions/ADR-0006-Workflow.md); plan approval does not authorize commits,
publication, or merging. Material changes return to the relevant approval gate.

## Affected areas

Identify affected packages, code, documentation, automation, and public interfaces and their intended changes.

## Implementation steps

Use stable story-local IDs. Specify ordered actions, prerequisites, and dependent steps without duplicating task status.

- **P-001 - [Step title]:** Action and intended result. Dependencies: none or prerequisite step IDs.

## Data, lifecycle, and failure handling

Describe relevant data/contracts, resource startup and cleanup, expected rejections, exceptional failures, and
observability. For work without these concerns, explain why this section is not applicable.

## Validation

Map every brief criterion ID to its verification method. This is a criterion-to-method mapping, not a manually
duplicated reverse mapping of the acceptance catalog. Name applicable checks and observable evidence to collect.

| Criterion | Verification method |
|-----------|---------------------|
| AC-001 | [Specific check establishing the result] |

For public UI/HTTP or library API behavior changes, identify the public-contract tests to write and observe failing
before production changes. Include type-contract checks for type-only public API changes. Identify applicable local
and CI gates and justify inapplicable checks; unavailable applicable checks block acceptance.
Before final review, integrate current main, repeat required checks, and obtain human acceptance of the current revision.

## E2E tests

For new or modified application/service features, describe the acceptance scenarios to create or update. Identify the
`tests/acceptance/` catalog feature/API, criterion, and scenario IDs, and name the intended Playwright test files under
workspace-root `tests/scenarios/<capability>/`. Identify the brief's proposed criterion additions, modifications, or
removals included in this plan's approval. The user approves criteria with the plan before implementation; register
approved changes in the catalog before feature work. Later behavioral changes/removals require renewed approval.

Scenarios reference criteria and concrete persona/data definitions; tests reference scenario IDs. Do not duplicate the
catalog's derived reverse mapping. Before completion, add relative links to implemented E2E test files and relevant
catalog entries, retaining criterion/scenario IDs; do not present planned paths as completed tests.

If no application/service feature changes, explain why E2E changes are not applicable. Keep this section for every
plan, including documentation-only, tooling-only, and library-only stories; document applicable library/other checks
under Validation. Follow [ADR-0007](../Architecture/Decisions/ADR-0007-Acceptance-catalog.md).

## Dependencies, risks, and open decisions

Record external prerequisites, sequencing constraints, risks, mitigations, and unresolved decisions.
Material unknowns must be resolved or explicitly bounded before approval. State when none remain.

## Migration and rollout

Describe relevant compatibility, adoption, migration, rollout, and recovery needs, or justify inapplicability.
Do not make releases or deployments additional workflow completion gates.

## Approval

Unapproved draft until an explicit user decision is recorded here.
When approved, record the date, decision source, approved plan scope and brief criterion IDs, and any bounded exclusions.
Do not invent approval, infer it from drafting, or treat it as commit, publication, or merge authorization.
Material requirements or design changes invalidate the affected approval until renewed.

## Related notes

- [Brief](Brief.md)
- [Tasks](Tasks.md)
