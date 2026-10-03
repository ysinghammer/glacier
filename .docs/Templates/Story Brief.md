---
created: {{date:YYYY-MM-DD}}
tags:
  - story
---

# [Story title] - Brief

This document owns why and what, not implementation design or task progress. Follow
[ADR-0006: Workflow](../Architecture/Decisions/ADR-0006-Workflow.md) with proportionate detail.
Retain each section; explain inapplicability rather than leave empty prompts in a finished brief.
Requirements and criteria are unapproved until the user approves them with the [plan](Plan.md#approval).

## Problem

What problem are we solving, and for whom?

## Intended outcome

What should be true when this story is complete?

## Scope

- In scope:
- Out of scope:

## Requirements and constraints

Describe required capabilities, relevant existing behavior to preserve, and binding constraints.
Include applicable success, rejection, authorization, and boundary behavior. Do not prescribe implementation choices.

## Acceptance criteria

For application/service public behavior, propose additions, modifications, or removals using stable criterion IDs.
Reference existing catalog IDs when changing the same rule; use new IDs for distinct rules. For each addition or
modification, record:

- Criterion ID, title, and change type.
- Feature IDs and applicable public API operation IDs.
- Given: actor, permissions, and independently achievable public preconditions.
- When: one business action or public request.
- Then: explicit, objectively assertable public outcomes, with measurable bounds where applicable.
- Requirement/public-contract source references.

For removals, identify the criterion and explain why its behavior is no longer required. Criteria are approved with the
story plan before implementation; approved changes enter the acceptance catalog before feature work. Later behavioral
changes/removals require renewed approval. This brief records proposed changes and rationale, not a second current
baseline. Follow [ADR-0007](../Architecture/Decisions/ADR-0007-Acceptance-catalog.md).

For documentation-only, tooling-only, or library-only work, use stable story-local IDs without inventing application
business criteria. Preserve an ID when revising the same rule; never renumber or reuse it for unrelated behavior.
Each criterion must express an objectively verifiable result; avoid using checkboxes as a second execution tracker.

- **AC-001 - [Criterion title]:** Observable outcome or public-contract behavior.

## Open questions

Record unresolved requirements decisions and their impact. Resolve or explicitly bound material unknowns before
approval. State "None" when settled; do not invent unknowns.

## References

Link relevant code, discussions, and documentation.

## Related notes

- [Plan](Plan.md)
- [Requirements and plan approval](Plan.md#approval)
- [Tasks](Tasks.md)
