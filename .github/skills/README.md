# Glacier project skills

Skills operationalize the [repository policies](../../.policies/0001-compliance.md);
they do not replace them or grant permission for Git mutations, dependency additions,
agent/model overrides, or publication. Read all policies before project work.
Invoke the applicable skill through the host's skill loader; if unavailable,
report the blocker and obtain an approved resolution rather than silently omitting it.

All `.plan/` files, including epic/story/task plans, approvals and status/evidence,
remain ignored, secret-safe and local-only: never commit, force-add or copy planning
documents into tracked locations. Fresh-context handoffs use readable approved local
snapshots, exact approval responses and content/version identifiers, separately from
the integration branch and actual product prerequisite/task/story commits. Isolated
receivers require matching ignored local copies before work; missing/stale or tracked
plans block admission for a safe resolution. Actual authorized product completion
commits and normal hooks remain mandatory; local evidence is not a substitute.
Subjects use lowercase references (for example `story-001 task-000`) while canonical
plan IDs remain uppercase. The quality entry point is `pnpm run ci`; required
uncached story/epic execution uses `pnpm exec turbo run ci --force`.

## Workflow

| Skill                                                                     | When to use                                                                   |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [glacier-workflow](glacier-workflow/SKILL.md)                             | Enter/resume a change and enforce phase prerequisites and fresh handoffs.     |
| [glacier-interview](glacier-interview/SKILL.md)                           | Ask focused WHAT/WHY or HOW questions in the appropriate discovery context.   |
| [glacier-discovery](glacier-discovery/SKILL.md)                           | Create and obtain approval of the nontechnical epic and criteria.             |
| [glacier-technical-planning](glacier-technical-planning/SKILL.md)         | Resolve technical decisions and approve independently verifiable stories.     |
| [glacier-task-planning](glacier-task-planning/SKILL.md)                   | Plan stable tasks, dependencies, ownership, and approved agent resources.     |
| [glacier-implementation](glacier-implementation/SKILL.md)                 | Execute approved tasks/stories and integrate their completion evidence.       |
| [glacier-verification](glacier-verification/SKILL.md)                     | Run applicable actual gates and review criterion/policy conformance.          |
| [glacier-acceptance-publication](glacier-acceptance-publication/SKILL.md) | Obtain acceptance, preserve manual edits, and safely publish authorized work. |

## Engineering

| Skill                                                                 | When to use                                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [glacier-architecture-review](glacier-architecture-review/SKILL.md)   | Review boundaries, public APIs, lifecycle, dependencies, and ADR conformance.     |
| [glacier-library-contracts](glacier-library-contracts/SKILL.md)       | Verify public library runtime/type contracts and combined per-file coverage.      |
| [glacier-acceptance-scenarios](glacier-acceptance-scenarios/SKILL.md) | Maintain approved capability scenarios and public-only real-stack acceptance.     |
| [glacier-package-scaffolding](glacier-package-scaffolding/SKILL.md)   | Configure only needed packages, approved dependencies, and real workspace gates.  |
| [glacier-react-storybook](glacier-react-storybook/SKILL.md)           | Apply presentation ownership, accessibility, stories, and package-specific tests. |

`glacier-interview` is the project's original local interview procedure, used for
both policy 0013 discovery sessions. Discovery remains nontechnical; technical
planning still requires a distinct fresh context and prior epic approval.
Unavailable required skills/tools stop the relevant phase until explicitly resolved.
