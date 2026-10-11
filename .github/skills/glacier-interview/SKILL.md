---
name: glacier-interview
description: Conduct Glacier requirement discovery or technical planning interviews. Use to clarify WHAT and WHY before an epic, or HOW in a fresh agent after epic approval; resolve ambiguity through focused questions and explicit decisions.
---

# Glacier interview

## Triggers

Use for either discovery session required by policy 0013, or when an approved
change needs renewed clarification. This is an original project-local interview
procedure, not an installed third-party skill.

## Inputs and prerequisites

Read every repository policy, especially [workflow](../../../.policies/0013-development-workflow.md)
and [scenario criteria](../../../.policies/0012-acceptance-catalog.md). Obtain the
user's request, relevant existing behavior, and the current phase. For HOW, require
the committed approved epic and a distinct fresh agent context. Read relevant
repository evidence before asking questions that inspection can answer.

## Procedure

1. Select WHAT or HOW from the workflow phase. If ambiguous, ask which outcome
   the session should produce. Never combine both phases to avoid a fresh handoff.
2. Keep a decision record: question, answer, rationale, affected requirement,
   unresolved ambiguity, and approval state. Distinguish user decisions from
   repository facts and agent recommendations.
3. Ask one focused question at a time using the host's question tool. Provide
   concrete choices when useful, put the recommendation first, and explain its
   tradeoff without making it a default decision. Allow freeform answers; do not
   bundle independent choices or ask for information already available locally.
4. Follow ambiguous answers with concrete examples or counterexamples. Probe the
   highest-impact unresolved decision next rather than administering a fixed
   questionnaire. Do not manufacture scope, permissions, bounds, or dependencies.
5. Periodically summarize resolved decisions and remaining blockers. At the end,
   present the complete outcome and criteria for explicit approval using the
   question tool. Silence or general enthusiasm is not approval.

### WHAT: problem and observable outcomes

Clarify intended users, the problem, business value, actions and observable
results, scope/non-goals, constraints, preserved behavior, success measures, and
failure/rejection/authorization cases. Ask about timing or limits only where
meaningful; obtain exact bounds rather than inventing them.

Stay nontechnical. Do not prescribe libraries, architecture, symbols, file edits,
agent resources, or execution strategy. For application/service work, propose
publicly achievable Given/When/Then scenarios and stable IDs. For library,
documentation, or tooling work, use story-local acceptance criteria instead.
Return approved findings to [discovery](../glacier-discovery/SKILL.md).

### HOW: technical contracts and independent verification

Preserve the approved WHAT. Inspect relevant source and public APIs; resolve exact
contracts, architecture, file/symbol ownership, dependency approvals, persistence
and migrations if applicable, compatibility, failures, lifecycle, tests,
documentation, and integration. Explain concrete alternatives and tradeoffs.

Identify how each proposed story can be independently verified after completed
prerequisites. Surface unavailable tooling or agent capabilities. Proposed agent
counts/model overrides need later task-plan approval, not implied permission.
Return findings to [technical planning](../glacier-technical-planning/SKILL.md).

## Outputs and handoff evidence

Supply the decision record, approved outcome/criteria, unresolved questions,
source references, and the exact approval response. The calling workflow skill
owns the epic/story artifact and its authorized commit. A renewed WHAT decision
must update the epic and receive approval before HOW or implementation resumes.

## Approval and stop gates

Stop on implementation-blocking ambiguity, missing required fresh context,
unavailable question capability, or absent approval. Explain the blocker and
obtain an approved resolution; never invent an answer. Interviewing does not
authorize implementation, dependency installation, Git mutations, or publication.
