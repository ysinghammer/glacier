---
name: glacier-technical-planning
description: Resolve HOW and write independently verifiable Glacier stories in a fresh agent after epic approval. Use for exact contracts, architecture, affected files, compatibility, testing, and technical story approval.
---

# Glacier technical planning

## Triggers

Use at workflow phase 2, or to revise the technical plan after an approved change
in requirements or a newly discovered implementation blocker.

## Inputs and prerequisites

Require a distinct fresh agent context, integration branch, committed approved
epic, approval evidence, and relevant existing code. Read every policy and
[workflow](../../../.policies/0013-development-workflow.md). Require
[glacier-interview](../glacier-interview/SKILL.md), current manifests/CI, and
active accepted ADRs where present.

## Procedure

1. Inspect the exact affected public contracts and source. Invoke
   `glacier-interview` in HOW mode. Resolve architecture, exact files/symbols,
   dependencies, data/migrations if applicable, compatibility, failures,
   lifecycle, tests, documentation, and integration.
2. Apply [architecture review](../glacier-architecture-review/SKILL.md) and the
   relevant library/application/React procedures. Obtain explicit approval for
   every new direct dependency within its scope; policy listings are not consent
   to add or upgrade dependencies.
3. Create `.plan/stories/STORY-NNN.md` with unique stable zero-padded numbers
   beginning at `001`. Bound each story to its own observable outcome and
   independent verification after completed prerequisites.
4. Include every required section: `Story and epic references`, `Outcome and
acceptance criteria`, `Dependencies`, `Implementation`, `E2E tests`,
   `Validation`, `Risks and decisions`, and `Status and evidence`.
   Implementation must name exact files/symbols, behavior, exclusions, contracts,
   failure cases, and applicable migration/compatibility/documentation changes.
5. Retain `E2E tests` even when inapplicable; give the specific reason and
   applicable other checks in `Validation`. Application stories identify
   capabilities, approved scenario proposals/IDs, and intended Playwright paths.
   Validation specifies exact current commands, expected results, and regressions.
6. Verify every epic requirement maps to stories, no unapproved scope appears,
   dependencies are explicit/acyclic, and no story depends on unfinished future
   work to become verifiable. Split or reorder stories when needed.
7. Obtain user approval of technical decisions and the complete story set.
   Approved application scenarios must enter their durable capability Markdown
   before feature implementation. Commit approved plans with permission, then
   hand off to a fresh [task planner](../glacier-task-planning/SKILL.md).

## Outputs and handoff evidence

Supply committed epic/story paths and revisions, branch, exact approvals,
requirement-to-story mapping, prerequisite public contracts, technical decisions,
validation commands, scenario baseline references, and blockers. Keep criterion
verification mapping distinct from derived scenario coverage reports.

## Approval and stop gates

A changed WHAT must return to discovery for renewed epic/criterion approval.
Missing fresh context/interview capability, unknown contracts, unapproved
dependencies, unverifiable stories, or absent technical approval blocks task
planning. Do not implement product changes or select unapproved agent overrides.
