---
name: glacier-discovery
description: Discover and document a Glacier epic's WHAT and WHY before technical planning. Use for new change requirements, measurable acceptance criteria, scenario proposals, and explicit epic approval.
---

# Glacier discovery

## Triggers

Use at phase 1 of a new change, or when changed intended outcomes require renewed
epic approval. This phase defines the need, not the implementation.

## Inputs and prerequisites

Read every policy, especially [workflow](../../../.policies/0013-development-workflow.md)
and [acceptance catalog](../../../.policies/0012-acceptance-catalog.md).
Require the request, known existing behavior, safely established integration
branch, and available [glacier-interview](../glacier-interview/SKILL.md).
Determine application/service versus library/tooling/documentation scope.

## Procedure

1. Invoke `glacier-interview` in WHAT mode. Clarify the problem, users, business
   value, observable outcomes, non-goals, constraints, preserved behavior, success
   criteria, and relevant failure/rejection cases without prescribing technology.
2. Resolve implementation-blocking questions with the user. Separate facts,
   proposals, and approved decisions. Make acceptance criteria measurable where
   relevant, including exact approved limits and timing bounds.
3. Write `.plan/EPIC.md` with these exact sections:
   `Problem and business value`, `Users and intended outcomes`, `Scope and non-goals`,
   `Requirements and acceptance criteria`, `Constraints and preserved behavior`,
   `Scenario proposals`, `Open questions and decisions`, and `User approval`.
4. For application/service work, use
   [acceptance scenarios](../glacier-acceptance-scenarios/SKILL.md) to propose
   additions/modifications/removals with stable IDs, observable criteria, and
   rationale. Preserve existing IDs and unaffected required behavior.
   Nonapplication changes use local criteria without invented business scenarios.
5. Present the complete epic and criteria for explicit approval. Record the
   actual response and unresolved blockers; do not label a proposal approved.
6. Save the approved epic as an ignored, secret-safe local snapshot with the exact
   approval response and a content/version identifier. Never commit or force-add
   `.plan/` artifacts or copy plans into tracked locations. Tracked plans require
   a safe approved resolution. Hand off to a distinct technical agent through
   [technical planning](../glacier-technical-planning/SKILL.md).

## Outputs and handoff evidence

Produce the approved epic, decision/source references, criterion IDs and scenario
proposals, scope exclusions, and exact approval evidence. Supply the integration
branch and production revision separately from the readable ignored epic path,
plan content/version identifier and exact approval response. Include applicable
policies, preserved contracts, and unresolved nonblocking questions. An isolated
fresh receiver must obtain an ignored local copy with matching identifier before
work; missing/stale plans block technical planning.

## Approval and stop gates

Missing interview capability, unsafe branch state, unresolved outcomes, or absent
epic/criterion approval blocks technical planning. An approved epic does not
authorize dependencies, task resources, implementation, or publication. Do not
persist durable application scenario changes until their approval; do not
duplicate the later durable baseline in planning records.
