# 0013 - Development workflow

## Scope and prerequisites

1. Every new change MUST follow this workflow, including features, bug fixes, maintenance, and
   documentation changes. This policy describes the required process; reading or drafting it MUST NOT
   itself launch implementation agents or authorize Git mutations. Higher-priority agent permissions
   and tool restrictions MUST be respected. If a required capability is unavailable, the agent MUST
   explain the blocker and obtain an approved resolution, not silently omit a phase.
2. Before starting, the agent MUST read all repository policies, inspect the working tree, and identify
   the available session/subagent tools, `glacier-interview` skill, permitted LLM models, and quality commands.
   The actual [glacier-interview](../.github/skills/glacier-interview/SKILL.md) skill MUST be used for both discovery sessions. An unavailable skill MUST
   block those sessions until the user enables it or explicitly approves an alternative. The agent
   MUST NOT silently substitute a similarly named skill or install third-party resources.
3. Each change MUST have exactly one integration branch. By default, with explicit Git authorization,
   it MUST be created from freshly fetched `origin/main`, never from stale local `main` or an unrelated
   change branch:

   ```sh
   git fetch origin main
   git switch --create <type>/<lowercase-kebab-description> origin/main
   ```

   The type MUST be `feature` for new or enhanced behavior, `bugfix` for correcting defective behavior,
   or `chore` for maintenance, tooling, documentation, and behavior-preserving refactoring. `bugifx`
   is not a valid spelling; new `refactor/` branches MUST NOT be created even if legacy CI accepts them.
   Only when the user explicitly requests reuse MAY a clean existing branch serve as the integration
   branch instead. The selected branch and exact reuse approval MUST be recorded in the local epic.
   This exception MUST NOT authorize fetch/switch operations or rewriting existing commits.
   Existing branches MUST NOT be overwritten. Dirty or unrelated work MUST be preserved; if it prevents
   a safe branch switch, the agent MUST stop and ask the user rather than stash, reset, or carry it into
   the new change. Continuing the same epic, including the manual-edit handoff, MUST reuse its branch.

4. All temporary planning artifacts MUST live in `.plan/`: `.plan/EPIC.md` and
   `.plan/stories/STORY-<number>.md`. Story numbers MUST be unique, stable, and zero-padded, starting at
   `001`. Task numbers MUST be stable within their story, also starting at `001`. Planning artifacts
   MUST contain no secrets. Every file in `.plan/`, including tasks, approvals and status/evidence
   updates, MUST remain ignored, local-only and NEVER committed. Agents MUST NOT force-add plans or
   copy planning documents into tracked locations. If tracked plans are discovered, the agent MUST
   stop and obtain a safe resolution rather than silently committing/removing them or rewriting history.
   Handoffs MUST use readable approved local snapshots with exact approval evidence and content/version
   identifiers, separate from the production branch/revision. Isolated receiving workspaces MUST receive
   ignored local copies with matching identifiers before work begins; missing or stale plans MUST block
   the receiving phase.

## Phase 1: Understand WHAT

5. Before any implementation, the initial agent MUST run an interactive, nontechnical `glacier-interview`
   session with the user. It MUST clarify the problem, intended users, business value, observable
   outcomes, scope, non-goals, constraints, existing behavior to preserve, success criteria, and
   relevant failure or rejection cases. It MUST focus on WHAT is needed and WHY, not prescribe code,
   architecture, libraries, file changes, or execution strategy.
6. The outcome MUST be saved in `.plan/EPIC.md` with these sections:

   - `Problem and business value`
   - `Users and intended outcomes`
   - `Scope and non-goals`
   - `Requirements and acceptance criteria`
   - `Constraints and preserved behavior`
   - `Scenario proposals`
   - `Open questions and decisions`
   - `User approval`

   Acceptance criteria MUST be observable and measurable where applicable. Application/service
   scenario proposals MUST follow policy 0012; other changes MUST use applicable local criteria,
   without inventing business scenarios. Implementation-blocking questions MUST be resolved with the
   user. The user MUST approve the epic and its criteria before technical planning begins.

## Phase 2: Understand HOW in a fresh agent session

7. After the epic is approved, a NEW AGENT session MUST read the approved local epic snapshot and repository
   policies, inspect the relevant code, and run a second interactive `glacier-interview` session. This session
   MUST be deeply technical: resolve exact contracts, architecture, affected files and symbols,
   dependencies, data changes/migrations where applicable, compatibility, failure handling, testing,
   documentation, and integration. It MUST NOT silently redefine approved outcomes; changed WHAT
   decisions MUST return to the user for renewed epic/criterion approval.
8. The technical agent MUST write `.plan/stories/STORY-<number>.md` for every story required to
   implement the entire epic. Each story MUST be a bounded task with its own testable outcome,
   explicit acceptance criteria, and independent verification. A story MAY depend on completed
   prerequisite stories, but MUST NOT require another unfinished story to become verifiable. Stories
   MUST be split or reordered if their contracts or tests cannot stand alone after prerequisites.
9. Every story MUST contain:

   - `Story and epic references`: stable ID, purpose, and the epic requirements it satisfies.
   - `Outcome and acceptance criteria`: complete observable obligations and exclusions.
   - `Dependencies`: prerequisite story IDs, consumed contracts, and integration assumptions.
   - `Implementation`: exact files/symbols to create, change, or remove; contracts, behavior,
     failure cases, migrations, compatibility, and documentation updates as applicable.
   - `E2E tests`: applicable capabilities, scenario IDs, approved proposals, and intended test paths;
     or explicit inapplicability with a reason, as required by policy 0012.
   - `Validation`: independent checks, exact commands, expected outcomes, and regression coverage.
   - `Risks and decisions`: resolved technical choices and any remaining blockers.
   - `Status and evidence`: initial status, later execution results, local snapshot identifiers and
     actual product commit references, kept distinct.

   The agent MUST check that every epic requirement maps to at least one story and that no story
   introduces unapproved scope. The user MUST approve technical decisions and the story set before
   the next phase. Approved application/service scenarios MUST enter their durable capability
   documentation before feature implementation.

## Phase 3: Plan TASKS in a fresh agent session

10. After stories are written and approved, a NEW AGENT session MUST spawn one planning subagent
    per story. Each subagent MUST read the epic, its story, prerequisite contracts, and all applicable
    policies, then add a `Tasks` section to its assigned story file. Subagents MUST NOT implement
    product changes in this phase or edit another subagent's story. The parent MUST reconcile
    cross-story dependencies and shared-file ownership.
11. Every task MUST specify its stable `STORY-<number>/TASK-<number>` ID, objective, exact steps and
    owned files, inputs/outputs, acceptance criteria, tests with exact commands and expected results,
    dependencies by ID, initial status, and completion evidence fields distinguishing local plan
    versions from actual product commits. It MUST explicitly state
    whether execution is sequential or parallel and which other tasks may safely run alongside it.
    Ordered lists alone MUST NOT imply dependencies; cycles and unsatisfied prerequisites MUST block
    approval.
12. Every task MUST also specify the proposed number of execution subagents, each subagent's bounded
    responsibility, its proposed available LLM model, and a rationale based on complexity/risk.
    Model selection MUST respect available models and user-configured permissions. The planning
    parent MUST present the aggregate agent counts, concurrency, model assignments, and dependency
    schedule for user approval before execution. It MUST NOT invent model availability or impose
    unapproved overrides. A task needing no further delegation MUST explicitly say so; the story
    agent remains responsible for that task.
13. The planning parent MUST verify complete story-to-task coverage, isolated testability, disjoint
    parallel ownership, and the feasibility of the approved resources. The completed task plans
    MUST remain ignored and uncommitted. Before handing off to implementation, the parent MUST supply
    the readable approved local task snapshots, exact task/resource/schedule approvals and content
    identifiers, plus the production branch and prerequisite revisions separately.

## Phase 4: Implement in a fresh orchestrator session

14. After task approval, a NEW AGENT session MUST act as the implementation orchestrator. It MUST
    read the epic, all stories/tasks, approvals, policies, and current branch state. It MUST spawn a
    story agent for each story, admitting dependent stories only after their prerequisites pass.
    Each story agent MUST use only its approved task subagents according to the task plan and enforce
    explicit dependencies. Agent-count/model changes MUST receive user approval before proceeding.
    A task approved with zero further delegation MUST be executed by its story agent itself.
15. Fresh sessions MUST have distinct agent contexts; resetting a prompt or renaming the same
    session does not satisfy a NEW AGENT requirement. Each handoff MUST include readable ignored local
    plan paths, exact approvals, plan content/version identifiers, dependencies and relevant evidence,
    with the production integration branch/revision separately. An isolated checkout MUST receive
    matching ignored local copies before admission; checking out product commits does not supply plans.
    Missing plans, mismatched identifiers or absent approval evidence MUST block the phase.
    Internal agent worktrees/branches MUST derive from the epic's integration branch at the required
    prerequisite revision, not start a separate epic from `origin/main`.
16. Concurrent implementation agents MUST use isolated worktrees/checkouts and exclusive file
    ownership. Agents MUST NOT independently stage or commit in the same shared checkout. If
    isolation is unavailable, the orchestrator MUST serialize implementation and Git operations
    while retaining separate agent contexts. Story agents MUST integrate task commits in dependency
    order; the orchestrator MUST integrate story commits onto the epic branch in dependency order.
    Conflicts MUST be resolved and affected checks rerun before dependent work is released.
17. Task agents MUST implement only their approved scope, update related tests/documentation, and
    pass their independent checks before marking tasks done and committing their changes. Each
    task MUST produce its own explicitly authorized product-change commit. Story agents MUST verify
    all tasks and integration, run the story quality gate, then create an actual authorized story
    completion commit recording meaningful evidence in its body and the ignored story plan.
    Even when task commits contain all product changes, an actual story completion commit MUST
    establish the outcome. If no owned tracked completion change remains, an explicitly authorized
    empty `TASK-000` commit MAY carry that evidence; agents MUST NOT manufacture tracked planning
    records or copy plans to satisfy this requirement. Local status updates alone MUST NOT replace
    task/story commits. Absent commit authorization MUST block completion. Hooks MUST NOT be bypassed;
    unrelated changes MUST NOT be staged.
18. Task and story completion commits MUST follow the repository's Conventional Commit scope rules
    and include both story and task numbers in their subject, for example:

    ```text
    feat(reflection): story-001 task-002 add public metadata lookup
    chore(workspace): story-001 task-000 record story completion
    ```

    Subjects MUST use lowercase story/task references to satisfy commitlint; canonical plan IDs
    remain uppercase (`STORY-001/TASK-002`). `TASK-000` MUST be reserved for story
    integration/completion, never an implementation task.
    Commit bodies MUST explain meaningful changes, criterion/check results and limitations, and include
    required agent attribution. Completion evidence MUST remain in these bounded commit bodies and
    ignored local plans, never tracked planning artifacts.
    Integration MUST preserve the task/story commit history; unpublished completion claims MUST NOT
    replace actual commits.

## Quality gates

19. After every story, its integrated result MUST pass the repository's CI-equivalent workspace
    quality checks before dependent stories start. After every story is done, the final integrated
    epic MUST pass them again. The current CI entry point is `pnpm run ci`; required execution MUST
    not be satisfied by cached results. Its uncached equivalent is:

    ```sh
    pnpm run ci
    pnpm exec turbo run ci --force
    ```

    Agents MUST use the declared Node.js/pnpm versions and CI prerequisites from
    `.github/workflows/quality.yml`, including Chromium for applicable library browser tests.
    A library-specific Node-only verification scope MUST NOT waive applicable browser requirements
    for other libraries, React stories or application/service tests.
    Branch naming and the change branch's commit range MUST also be checked against CI rules before
    publication. If CI scripts change, the agent MUST use the actual current equivalent.

20. Tests MUST prove approved criteria and follow policies 0010-0012. Applicable real-stack suites
    MUST actually execute uncached. Documentation-only stories MUST perform their applicable
    documentation checks; genuinely inapplicable product checks MUST be explained, not fabricated.
    Results MUST record exact commands, pass/fail, and limitations in story evidence. Failures or
    unavailable required checks MUST block completion and publication until resolved; existing
    failures MUST NOT be hidden or claimed as success.

## Phase 5: User acceptance and manual handoff

21. Only after the epic's criteria and final quality gate pass, the orchestrator MUST present the
    delivered outcomes and known limitations and ask the user whether the outcome is acceptable.
    Silence MUST NOT count as approval. Nothing MUST be pushed or published before explicit approval.
22. If the user says no, the automated workflow MUST stop before cleanup, push, or PR creation.
    The agent MUST retain `.plan`, the change branch, commits, and local work, and hand control to
    the user for manual edits. It MUST NOT continue implementing unsolicited fixes or create a
    replacement branch.
23. If the user later explicitly says their additional changes are done and gives approval to
    publish, the agent MUST resume on the same branch, inspect the manual changes, update relevant
    ignored local evidence and snapshot identifiers, and rerun affected story checks and the final epic
    quality gate. User changes MUST
    NOT be overwritten. Uncommitted user changes MUST be committed with explicit user permission
    and mapped to the applicable story/task IDs. Changed requirements MUST be reconciled with the
    epic and durable criteria. If validation fails or acceptance is withdrawn, publication MUST
    stop again with `.plan` retained.

## Phase 6: Cleanup and publication

24. After explicit acceptance and cleanup authorization, the agent MUST preserve the exact approved
    `.plan/EPIC.md` contents outside `.plan` in recoverable, secret-safe local session storage for the PR
    body before deleting anything. The saved contents MUST be verified against the approved snapshot
    using its content identifier; this recovery artifact MUST remain untracked.
    Durable documentation, ADRs, capability scenarios, and test links MUST remain outside `.plan`;
    durable documents MUST NOT acquire links that break when planning files are removed.
25. With explicit cleanup authorization, the agent MUST delete only the verified change-owned `.plan`
    directory, never `plan`, unrelated user plans/files, or a broader directory. If ownership is mixed
    or uncertain, cleanup MUST stop for a safe resolution. Cleanup MUST be a local filesystem operation,
    never a planning-removal commit; plans MUST NOT be tracked to manufacture a removal.
    The post-cleanup final tree MUST pass the applicable final quality gate and changed-link checks
    before push. On failure, the agent MUST stop, preserve the saved epic and Git history, and report
    the blocker.
26. With separate explicit push authorization, the agent MUST push the accepted integration branch
    and set its upstream:

    ```sh
    git push --set-upstream origin <type>/<lowercase-kebab-description>
    ```

    It MUST NOT force-push, push unrelated branches, or push `main`. If push fails, the workflow
    MUST report that failure and retain the branch and saved epic for recovery.

27. After a successful push and with explicit PR authorization, the agent MUST create a GitHub PR
    targeting `main`, normally through
    `gh pr create --base main --head <branch> --title <title> --body-file <saved-pr-body>`.
    If a higher-priority host integration requires its native PR-creation tool, that tool MUST be
    used instead and the deviation MUST be disclosed; shell commands MUST NOT bypass that restriction.
    Before drafting the body, the agent MUST inspect `.github/pull_request_template.md` and
    `.github/PULL_REQUEST_TEMPLATE/`. Existing template headings, comments, checklists, and order
    MUST be preserved and populated accurately. The complete approved epic contents MUST be
    embedded in the body, under the template's `Summary` section when available; the epic MUST NOT
    merely be linked from the deleted `.plan` path. Validation MUST list exact commands and their
    results. If no template exists, the full epic MAY be the body with validation evidence appended.
28. The agent MUST verify the PR exists on the intended repository, branch, and base, then give the
    user its actual clickable URL for manual merge. If creation fails, the agent MUST report that
    the branch was pushed but the PR was not created, preserve the saved body, and avoid duplicate PRs
    on retry. The workflow MUST end after delivering the PR URL. It MUST NOT merge automatically or
    initiate further development; any required host-managed PR follow-through is separate from this
    implementation workflow.
