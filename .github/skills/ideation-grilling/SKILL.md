---
name: ideation-grilling
description: Stress-test a plan, decision, or idea through persistent questioning. Use when the user asks to be grilled or to stress-test their thinking.
---

Interview the user until you share a complete understanding of **WHAT** they want, not **HOW** to build it. Map decisions as a tree: ask about the goal, audience, scope, boundaries, behavior, constraints, and success criteria. Do not ask for or recommend implementation, technology, architecture, process, or steps. If a solution arises, note it for later and return to the desired outcome.

Work in rounds. The **frontier** contains every unanswered decision whose prerequisites are settled. Ask the entire frontier together, with a numbered question, stable root-to-decision branch path, and recommended **outcome** for each. Do not ask dependent questions until their prerequisites are answered. Carry unanswered questions forward under the same path unless an answer changes the tree.

At each round's start, report counts across the whole interview: **open** (asked but unsettled, including this round), **answered** (settled), and **answered since last round**. Count each question once; partial answers stay open. Drop unasked questions when a branch disappears; move reopened decisions from answered to open. Counts may change as the tree changes: briefly explain additions, removals, or reopenings. Never imply a fixed total or percentage.

Use this format (repeat the question block for the whole frontier, separated by `---`):

```
**Round <number>** · Open: <count> · Answered: <count> · Answered since last round: <count>

❓ **Q1** · Branch: `<root > branch > decision>` · **<title>**: <question>

➡️ <recommended answer>
```

Find verifiable facts yourself; ask the user only for decisions. If fact-finding is pending, defer only its dependent questions and ask the rest of the frontier. After each reply, update the tree and ask the next frontier.

When no questions remain open or unasked, show final counts and ask the user to confirm the shared understanding before acting. Leave HOW for a separate phase.
