---
name: glacier-verification
description: Verify Glacier task, story, and epic outcomes with applicable uncached workspace gates and manual policy review. Use to collect truthful criterion evidence, identify blockers, and distinguish mappings, assertions, execution, and coverage.
---

# Glacier verification

## Triggers

Use before task/story completion, before dependent stories start, for final epic
acceptance, and after manual edits or publication cleanup.

## Inputs and prerequisites

Read all policies, especially [compliance](../../../.policies/0001-compliance.md),
[testing](../../../.policies/0010-library-testing.md),
[full-stack testing](../../../.policies/0011-full-stack-testing.md),
[catalog](../../../.policies/0012-acceptance-catalog.md), and
[workflow](../../../.policies/0013-development-workflow.md).
Require approved criteria, changed-file scope, integration revision, current
manifests/Turbo/CI configuration, and previous evidence to identify regressions.
Require readable approved ignored local plans, exact approval responses and plan
content/version identifiers, separately from production revisions/commit evidence.
Isolated receivers need ignored local copies with matching identifiers before
admission; missing/stale plans block work. All `.plan/` artifacts stay secret-safe,
local-only and never committed, force-added or copied into tracked locations;
tracked plans require a safe approved resolution.

## Procedure

1. Activate the exact declared Node/pnpm versions; never bypass strict engines.
   Read actual scripts and CI prerequisites, including applicable Chromium setup.
   Do not install dependencies unless manifests changed or a required command
   fails because dependencies/tools are missing; preserve frozen install mode.
2. Map every approved criterion to observable evidence. Inspect assertion quality
   manually: passing discovery, links, coverage, or logs alone does not prove a
   behavioral criterion. Check public API boundaries and meaningful failures.
3. Run current applicable task checks through pnpm/Turborepo. Code changes require
   lint/format and applicable type/build gates after each change. Documentation-only
   work requires documentation consistency/conformance and changed-link checks;
   explain genuinely inapplicable product checks, never fabricate execution.
4. After each story and for the final epic, execute the actual current
   CI-equivalent gate without cached acceptance evidence. Policy 0013 currently
   identifies the root script and its forced uncached equivalent; re-read scripts
   if they change:

   ```sh
   pnpm run ci
   pnpm exec turbo run ci --force
   ```

5. Apply [library contracts](../glacier-library-contracts/SKILL.md) or
   [acceptance scenarios](../glacier-acceptance-scenarios/SKILL.md) where applicable.
   Library checks enforce combined 100% per-file/all-metric coverage and separate
   public type contracts. Application acceptance requires catalog validation and
   the complete actual uncached real-stack suite, not filtered/skipped/focused
   tests or retry-only passes.
6. Review active accepted ADRs, inward architectural dependencies, lifecycle,
   failure observability, naming/types/JSDoc, dependency approvals, assertion
   quality, docs, and affected links. Tools do not establish all policy requirements.
7. Before publication, inspect the intended branch name and every commit in the
   intended change range against current CI and policy scope rules. Preserve
   hooks; do not rewrite user commits to make a gate pass.

## Outputs and handoff evidence

Record criterion IDs, scope/revision, exact commands, pass/fail/not-run results,
artifact paths, manual review findings, regressions, and limitations in story
evidence in ignored local story files, not tracked planning records. Keep local
snapshot identifiers separate from actual product prerequisite/task/story commits;
local updates never replace required authorized completion commits.
Keep scenario mapping completeness, assertion quality, actual execution,
runtime code coverage, and erased-type checking distinct.
Artifacts must follow their policy-owned ignored paths and remain secret-safe.

## Approval and stop gates

Failed or unavailable required checks block completion, dependents, and
publication. Report the actual blocker, including pre-existing failures; do not
skip controls, suppress executable coverage, reuse stale results, or imply broader
browser compatibility. Obtain approval before changing criteria or dependencies.
