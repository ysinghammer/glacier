---
name: implementation-verification
description: Run and report the full local verification gate and manual review checklist before requesting review, per ADR-0006. Use after implementation, before commit authorization.
---

Follow `.docs/Architecture/Decisions/ADR-0006-Workflow.md`, ADR-0001 through ADR-0005, and ADR-0007.

Run the applicable commands through pnpm/Turborepo, using the repository's actual scripts (inspect `package.json` and
`turbo.json`; do not invent scripts):

- lint, formatting, type-check, build;
- library tests with coverage (Vitest);
- acceptance catalog validation;
- the **complete, uncached** Playwright suite for applications/services.

Focused or filtered runs are development feedback only and never satisfy the gate. Skips, excluded scenarios,
concealed failures, and pass-on-retry results do not count as passing.

Reporting rules:
- Report each gate as passed, failed, or not applicable with a reason. Never describe unavailable tooling, a missing
  script, or a skipped step as success; failed or unavailable applicable gates block acceptance until resolved.
- Bootstrap work must establish and demonstrate its applicable gates.
- Documentation-only work verifies ADR conformance, consistency, and changed links (see `review-adr-conformance`) and
  must not claim code checks ran.

Then do the manual review of what automation does not establish: architecture boundaries, all active ADRs, dependency
approval against the dependency tables, assertion quality (catalog completeness is not proof), public contracts, and
documentation. Update the story tasks with evidence. Verification does not authorize commits.
