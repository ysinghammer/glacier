---
name: planning-grilling
description: Stress-test how to implement a defined goal through persistent questioning. Use when the user asks to be grilled on an implementation plan or technical approach.
---

Interview the user until you share a detailed understanding of **HOW** to achieve the goal. Start from the intended outcome and known constraints; clarify any missing requirements before planning around them. Map implementation decisions as a tree: approach, architecture, interfaces, data, dependencies, sequencing, failure handling, migration, verification, and rollout where relevant. Explore tradeoffs and recommend a concrete choice for each decision; do not assume preferences or ask the user for facts you can verify.

Work in rounds. The **frontier** contains every unanswered decision whose prerequisites are settled. Ask the entire frontier together, with a numbered question, stable root-to-decision branch path, and recommended **approach** for each. Do not ask dependent questions until their prerequisites are answered. Carry unanswered questions forward under the same path unless an answer changes the tree.

At each round's start, report counts across the whole interview: **open** (asked but unsettled, including this round), **answered** (settled), and **answered since last round**. Count each question once; partial answers stay open. Drop unasked questions when a branch disappears; move reopened decisions from answered to open. Counts may change as the tree changes: briefly explain additions, removals, or reopenings. Never imply a fixed total or percentage.

Use this format (repeat the question block for the whole frontier, separated by `---`):

```
**Round <number>** · Open: <count> · Answered: <count> · Answered since last round: <count>

❓ **Q1** · Branch: `<goal > branch > decision>` · **<title>**: <question>

➡️ <recommended approach and brief rationale>
```

Inspect the existing system to establish verifiable facts; ask the user only for decisions. If fact-finding is pending, defer only its dependent questions and ask the rest of the frontier. After each reply, update the tree and ask the next frontier.

When no questions remain open or unasked, show final counts and produce a concrete implementation plan: ordered steps with dependencies, affected components and interfaces, key technical choices, validation, and relevant migration, rollout, and risks. Ask the user to confirm the plan before implementing it.
