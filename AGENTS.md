# Agent guidance

The project wiki is the Obsidian vault in [.docs](.docs/Home.md). Start there for project context, engineering practices, architecture, and stories.

Before making any project change, read the [architecture decisions index](.docs/Architecture/Decisions/Index.md) and every accepted, active ADR in that directory. These decisions are binding: check the proposed change against all of them and follow their requirements. If a change conflicts with an ADR, revise the change or update the existing ADR to authorize it before accepting the change; do not silently disregard a decision.

For technology and package details, consult the [architecture index](.docs/Architecture/Index.md) and its linked techstack and dependency notes. When changing an architectural decision, follow the [decisions index](.docs/Architecture/Decisions/Index.md) and [decision template](.docs/Templates/Decision.md), and keep directly affected wiki notes consistent.

Every repository change follows the [workflow decision](.docs/Architecture/Decisions/ADR-0006-Workflow.md): a proportionate story under [Stories](.docs/Stories/Index.md), one story branch from current `origin/main`, explicit user approval of the plan and acceptance criteria before implementation, and separate explicit authorization for commits, push/PR publication, and merge. Use the skills in [.github/skills](.github/skills) for branching, story documents, commits, scaffolding, and review/merge; invoking a skill does not by itself grant any of those authorizations.
