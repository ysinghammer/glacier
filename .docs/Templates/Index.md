# Templates

Obsidian's built-in **Templates** plugin is enabled and its template folder is set to `Templates`. To use a template, create a note in its destination folder and run **Templates: Insert template** from the command palette. The plugin replaces `{{date:YYYY-MM-DD}}` at insertion time.

For stories, create a folder under [Stories](../Stories/Index.md) with `Brief.md`, `Plan.md`, and `Tasks.md`, then insert the corresponding [Story Brief](Story%20Brief.md), [Story Plan](Story%20Plan.md), and [Story Tasks](Story%20Tasks.md) templates into those notes. `{{title}}` is deliberately not used: all stories have files named `Brief.md`, `Plan.md`, and `Tasks.md`, so their file titles are not the story title. Story templates carry a `story` tag. Replace `[Story title]` and other prompts manually.

Sibling links such as `Plan.md` are destination placeholders, not links to other template files. After insertion,
adjust links to shared vault notes for the destination folder: for example, a template's
`../Architecture/Decisions/ADR-0006-Workflow.md` becomes `../../Architecture/Decisions/ADR-0006-Workflow.md` under
`Stories/<story-slug>/`. Obsidian's Templates plugin does not perform this relocation automatically.

The brief owns requirements, the plan owns design and criterion-to-verification mapping, and tasks own execution.
Keep each template's sections with proportionate content or explicit inapplicability. Record joint requirements/plan
approval only in the plan and link to it; do not duplicate an overall story status. Tasks use stable IDs, explicit
statuses/dependencies, completion conditions, evidence, and blockers rather than an unqualified checkbox list.
Tasks also retain numbered execution waves with exact concurrent worker counts, prerequisites, file/resource
ownership, and safe concurrency rationale; human waits use zero workers and evidence has one serialized writer.
The `documentation-brief`, `documentation-plan`, and `document-tasks` skills provide document-specific authoring
procedures; they do not authorize implementation or Git operations. Follow
[ADR-0006](../Architecture/Decisions/ADR-0006-Workflow.md) for workflow and approval boundaries and
[ADR-0008](../Architecture/Decisions/ADR-0008-Story-documentation.md) for the story document model.

The [Decision](Decision.md) template supports architecture notes. Decisions use the Nygard-style Context, Decision, and Consequences sections, plus an accepted status, creation date, an `ADR` tag, and optional related links for vault navigation. Replace `0000` in the ADR title with the next four-digit number, use `ADR-<number>-<short-title>.md` under [Decisions](../Architecture/Decisions/Index.md), and add a link to that index. Write binding rules with "must"; omit the related-links section when it is empty. Templates are starting points, not enforcement: the core plugin does not generate multiple files or require their presence.
