import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { ReportDirectoryService } from "../reporting/ReportDirectory.service.js";

/** Rule classes reported by the documentation check. */
type DocsRule =
  | "link"
  | "adr"
  | "story"
  | "tasks"
  | "template"
  | "story-size"
  | "machine-path"
  | "skill";

/** One documentation finding with its repository-relative file. */
interface IDocsFinding {
  readonly rule: DocsRule;
  readonly file: string;
  readonly message: string;
}

/** Failures block the check; warnings are reported without failing it. */
interface IDocsCheckResult {
  readonly failures: readonly IDocsFinding[];
  readonly warnings: readonly IDocsFinding[];
}

/** A Markdown file with code removed, so links and residue inside code are ignored. */
interface IMarkdownFile {
  readonly path: string;
  readonly text: string;
  readonly prose: string;
}

/** A relative link target resolved against its source file. */
interface IResolvedLink {
  readonly source: string;
  readonly target: string;
  readonly anchor: string | undefined;
  readonly raw: string;
}

/** A negative control: a mutation of the valid sample and the rule it must trip. */
interface IDocsControl {
  readonly name: string;
  readonly rule: DocsRule;
  readonly isWarning?: boolean;
  readonly files: Readonly<Record<string, string | null>>;
}

const TASKS_LIMIT_BYTES = 40 * 1024;
const PLAN_WARNING_BYTES = 30 * 1024;
const TASK_STATUSES = new Set(["pending", "in_progress", "blocked", "done"]);
const STORY_DOCUMENTS = ["Brief.md", "Plan.md", "Tasks.md"] as const;
const ADR_SECTIONS = ["## Context", "## Decision", "## Consequences"] as const;
const MACHINE_PATH = /(?:\/Users\/|\/home\/)[^/\s]+\/|\b[A-Za-z]:\\/;
const SPACED_DATE_TOKEN = /\{\s+\{|\}\s+\}/;
const OUTSIDE_TEMPLATE_RESIDUE = /\[(?:Story|Decision) title\]|\bADR-0000\b/;

/** Applies the repository documentation rules to the Markdown under a root using Node built-ins only. */
class DocsRules {
  /** Scans `.docs/` (without `.obsidian/` and `tmp/`), `.github/` Markdown and `AGENTS.md` below `root`. */
  public static check(root: string): IDocsCheckResult {
    const failures: IDocsFinding[] = [];
    const warnings: IDocsFinding[] = [];
    const files = DocsRules.discover(root).map((path) => DocsRules.read(root, path));
    const links = DocsRules.checkLinks(root, files, failures);
    DocsRules.checkAdrs(root, links, failures);
    DocsRules.checkStories(root, links, failures, warnings);
    DocsRules.checkTemplates(files, failures);
    DocsRules.checkSkills(root, failures);
    return { failures, warnings };
  }

  /** Lists in-scope Markdown files as repository-relative POSIX paths in stable order. */
  private static discover(root: string): string[] {
    const files: string[] = [];
    DocsRules.walk(root, ".docs", new Set([".docs/.obsidian", ".docs/tmp"]), files);
    DocsRules.walk(root, ".github", new Set(), files);
    if (existsSync(join(root, "AGENTS.md"))) files.push("AGENTS.md");
    return files.sort();
  }

  /** Recursively collects Markdown files, skipping excluded directories. */
  private static walk(root: string, path: string, excluded: Set<string>, files: string[]): void {
    if (excluded.has(path) || !existsSync(join(root, path))) return;
    for (const entry of readdirSync(join(root, path), { withFileTypes: true })) {
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) DocsRules.walk(root, child, excluded, files);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(child);
    }
  }

  /** Reads a file and blanks fenced and inline code while preserving offsets. */
  private static read(root: string, path: string): IMarkdownFile {
    const text = readFileSync(join(root, path), "utf8");
    const withoutFences = text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) =>
      block.replace(/[^\n]/g, " "),
    );
    const prose = withoutFences.replace(/`[^`\n]+`/g, (code) => " ".repeat(code.length));
    return { path, text, prose };
  }

  /** Requires every relative link and anchor to resolve; Templates are exempt because they resolve after insertion. */
  private static checkLinks(
    root: string,
    files: readonly IMarkdownFile[],
    failures: IDocsFinding[],
  ): IResolvedLink[] {
    const resolved: IResolvedLink[] = [];
    const anchors = new Map<string, Set<string>>();
    for (const file of files) {
      for (const raw of DocsRules.linkTargets(file.prose)) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) continue;
        const [pathPart = "", anchor] = raw.split("#", 2);
        let decoded: string;
        try {
          decoded = decodeURIComponent(pathPart);
        } catch {
          failures.push({ rule: "link", file: file.path, message: `undecodable link ${raw}` });
          continue;
        }
        const target =
          decoded === ""
            ? file.path
            : relative(root, resolve(root, dirname(file.path), decoded))
                .split(sep)
                .join("/");
        const link = { source: file.path, target, anchor: anchor || undefined, raw };
        resolved.push(link);
        if (file.path.startsWith(".docs/Templates/")) continue;
        if (target.startsWith("..") || !existsSync(join(root, target))) {
          failures.push({ rule: "link", file: file.path, message: `broken link ${raw}` });
          continue;
        }
        if (link.anchor === undefined || !target.endsWith(".md")) continue;
        const targetAnchors = anchors.get(target) ?? DocsRules.anchors(root, target);
        anchors.set(target, targetAnchors);
        if (!targetAnchors.has(link.anchor.toLowerCase())) {
          failures.push({ rule: "link", file: file.path, message: `missing anchor ${raw}` });
        }
      }
    }
    return resolved;
  }

  /** Extracts inline and reference-definition link targets from prose. */
  private static linkTargets(prose: string): string[] {
    const targets: string[] = [];
    for (const match of prose.matchAll(/\]\(\s*(?:<([^>]+)>|([^)\s]+))(?:\s+"[^"]*")?\s*\)/g)) {
      const target = match[1] ?? match[2];
      if (target !== undefined) targets.push(target);
    }
    for (const match of prose.matchAll(/^\s{0,3}\[[^\]]+\]:\s+<?([^>\s]+)>?/gm)) {
      if (match[1] !== undefined) targets.push(match[1]);
    }
    return targets;
  }

  /** Builds GitHub-style heading slugs (with duplicate suffixes) and explicit HTML anchors of a Markdown file. */
  private static anchors(root: string, path: string): Set<string> {
    const file = DocsRules.read(root, path);
    const result = new Set<string>();
    const counts = new Map<string, number>();
    for (const match of file.prose.matchAll(/^#{1,6}[ \t]+[^\n]*$/gm)) {
      const line = file.text.slice(match.index, match.index + match[0].length);
      const slug = line
        .replace(/^#{1,6}[ \t]+/, "")
        .replace(/[ \t]+#+[ \t]*$/, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s_-]/gu, "")
        .trim()
        .replace(/\s/g, "-");
      const count = counts.get(slug) ?? 0;
      counts.set(slug, count + 1);
      result.add(count === 0 ? slug : `${slug}-${count}`);
    }
    for (const match of file.text.matchAll(/\b(?:id|name)="([^"]+)"/g)) {
      if (match[1] !== undefined) result.add(match[1].toLowerCase());
    }
    return result;
  }

  /** Requires ADR filename, frontmatter, H1, Nygard sections and an index link for every decision. */
  private static checkAdrs(
    root: string,
    links: readonly IResolvedLink[],
    failures: IDocsFinding[],
  ): void {
    const folder = ".docs/Architecture/Decisions";
    if (!existsSync(join(root, folder))) return;
    for (const name of readdirSync(join(root, folder)).sort()) {
      if (!name.endsWith(".md") || name === "Index.md") continue;
      const path = `${folder}/${name}`;
      const match = /^ADR-(\d{4})-[A-Za-z0-9-]+\.md$/.exec(name);
      if (match === null) {
        failures.push({ rule: "adr", file: path, message: "filename must be ADR-NNNN-Title.md" });
        continue;
      }
      const text = readFileSync(join(root, path), "utf8");
      if (!/^---\n[\s\S]*?^status:\s*\S+[\s\S]*?^---$/m.test(text)) {
        failures.push({ rule: "adr", file: path, message: "frontmatter with status is missing" });
      }
      if (!new RegExp(`^# ADR-${match[1]}: \\S`, "m").test(text)) {
        failures.push({
          rule: "adr",
          file: path,
          message: `H1 must start with "ADR-${match[1]}: "`,
        });
      }
      for (const section of ADR_SECTIONS) {
        if (!new RegExp(`^${section}\\s*$`, "m").test(text)) {
          failures.push({ rule: "adr", file: path, message: `missing section "${section}"` });
        }
      }
      const isIndexed = links.some(
        (link) => link.source === `${folder}/Index.md` && link.target === path,
      );
      if (!isIndexed)
        failures.push({ rule: "adr", file: path, message: "not linked from Index.md" });
    }
  }

  /** Checks story folders, their index links, task records and active-story size and path limits. */
  private static checkStories(
    root: string,
    links: readonly IResolvedLink[],
    failures: IDocsFinding[],
    warnings: IDocsFinding[],
  ): void {
    for (const area of [".docs/Stories", ".docs/Archive"]) {
      if (!existsSync(join(root, area))) continue;
      const isActive = area === ".docs/Stories";
      for (const entry of readdirSync(join(root, area), { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const folder = `${area}/${entry.name}`;
        for (const document of STORY_DOCUMENTS) {
          if (!existsSync(join(root, folder, document))) {
            failures.push({ rule: "story", file: folder, message: `missing ${document}` });
          }
        }
        const isIndexed = links.some(
          (link) => link.source === `${area}/Index.md` && link.target.startsWith(`${folder}/`),
        );
        if (!isIndexed)
          failures.push({ rule: "story", file: folder, message: "not linked from Index.md" });
        if (existsSync(join(root, folder, "Tasks.md"))) {
          DocsRules.checkTasks(root, `${folder}/Tasks.md`, failures);
        }
        if (isActive) DocsRules.checkActiveStory(root, folder, failures, warnings);
      }
    }
  }

  /** Requires unique task IDs, allowed statuses, existing acyclic dependencies and named blockers. */
  private static checkTasks(root: string, path: string, failures: IDocsFinding[]): void {
    const text = readFileSync(join(root, path), "utf8");
    const sections = text.split(/^(?=#{1,3} )/m);
    const dependencies = new Map<string, string[]>();
    for (const section of sections) {
      const heading = /^### (T-\d{3}) - /.exec(section);
      if (heading?.[1] === undefined) continue;
      const id = heading[1];
      if (dependencies.has(id))
        failures.push({ rule: "tasks", file: path, message: `duplicate ${id}` });
      const status = /^- Status: ([a-z_]+)/m.exec(section)?.[1];
      if (status === undefined || !TASK_STATUSES.has(status)) {
        failures.push({
          rule: "tasks",
          file: path,
          message: `${id} has invalid status ${status ?? "(none)"}`,
        });
      }
      const dependencyLine = /^- Dependencies:([^\n]*(?:\n {2,}[^\n]*)*)/m.exec(section)?.[1] ?? "";
      dependencies.set(
        id,
        [...dependencyLine.matchAll(/T-\d{3}/g)].map((match) => match[0]),
      );
      const blocker = /^- Blocker:\s*([^\n]*)/m.exec(section)?.[1] ?? "";
      if (status === "blocked" && (blocker === "" || /^none\b/i.test(blocker))) {
        failures.push({ rule: "tasks", file: path, message: `${id} is blocked without a blocker` });
      }
    }
    for (const [id, required] of dependencies) {
      for (const dependency of required) {
        if (!dependencies.has(dependency)) {
          failures.push({
            rule: "tasks",
            file: path,
            message: `${id} depends on unknown ${dependency}`,
          });
        }
      }
    }
    const cycle = DocsRules.findCycle(dependencies);
    if (cycle !== undefined) {
      failures.push({
        rule: "tasks",
        file: path,
        message: `dependency cycle ${cycle.join(" -> ")}`,
      });
    }
  }

  /** Returns one dependency cycle, if any, by depth-first search. */
  private static findCycle(graph: ReadonlyMap<string, readonly string[]>): string[] | undefined {
    const done = new Set<string>();
    for (const id of graph.keys()) {
      const cycle = DocsRules.visit(id, graph, [], done);
      if (cycle !== undefined) return cycle;
    }
    return undefined;
  }

  /** Visits one task; `stack` holds the current path and `done` the tasks proven cycle-free. */
  private static visit(
    id: string,
    graph: ReadonlyMap<string, readonly string[]>,
    stack: string[],
    done: Set<string>,
  ): string[] | undefined {
    if (stack.includes(id)) return [...stack.slice(stack.indexOf(id)), id];
    if (done.has(id)) return undefined;
    stack.push(id);
    for (const next of graph.get(id) ?? []) {
      const cycle = DocsRules.visit(next, graph, stack, done);
      if (cycle !== undefined) return cycle;
    }
    stack.pop();
    done.add(id);
    return undefined;
  }

  /** Limits active story size and forbids machine-local absolute paths; archived stories are exempt. */
  private static checkActiveStory(
    root: string,
    folder: string,
    failures: IDocsFinding[],
    warnings: IDocsFinding[],
  ): void {
    const tasks = join(root, folder, "Tasks.md");
    if (existsSync(tasks) && statSync(tasks).size > TASKS_LIMIT_BYTES) {
      failures.push({ rule: "story-size", file: `${folder}/Tasks.md`, message: "exceeds 40 KB" });
    }
    const plan = join(root, folder, "Plan.md");
    if (existsSync(plan) && statSync(plan).size > PLAN_WARNING_BYTES) {
      warnings.push({ rule: "story-size", file: `${folder}/Plan.md`, message: "exceeds 30 KB" });
    }
    for (const entry of readdirSync(join(root, folder), { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      if (MACHINE_PATH.test(readFileSync(join(root, folder, entry.name), "utf8"))) {
        failures.push({
          rule: "machine-path",
          file: `${folder}/${entry.name}`,
          message: "contains a machine-local absolute path",
        });
      }
    }
  }

  /** Forbids template residue outside Templates and the formatter-spaced date token inside them. */
  private static checkTemplates(files: readonly IMarkdownFile[], failures: IDocsFinding[]): void {
    for (const file of files) {
      const isTemplate = file.path.startsWith(".docs/Templates/");
      if (SPACED_DATE_TOKEN.test(file.prose)) {
        failures.push({ rule: "template", file: file.path, message: "spaced double-brace token" });
      }
      if (!isTemplate && OUTSIDE_TEMPLATE_RESIDUE.test(file.prose)) {
        failures.push({
          rule: "template",
          file: file.path,
          message: "template placeholder residue",
        });
      }
    }
  }

  /** Requires each skill's frontmatter name to equal its folder name. */
  private static checkSkills(root: string, failures: IDocsFinding[]): void {
    const folder = ".github/skills";
    if (!existsSync(join(root, folder))) return;
    for (const entry of readdirSync(join(root, folder), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const path = `${folder}/${entry.name}/SKILL.md`;
      const text = existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : "";
      const name = /^---\n[\s\S]*?^name:\s*["']?([^"'\n]+?)["']?\s*$/m.exec(text)?.[1];
      if (name !== entry.name) {
        failures.push({
          rule: "skill",
          file: path,
          message: `name ${name ?? "(none)"} must equal folder`,
        });
      }
    }
  }
}

/** Runs documentation-check negative controls on generated samples, then checks the repository. */
class DocsVerification {
  /** Fails the process when a control does not behave as expected or the repository has a failing finding. */
  public static async run(): Promise<void> {
    const root = process.cwd();
    const directory = await ReportDirectoryService.create(root, "docs-verification");
    const controls = DocsVerification.runControls(join(directory, "samples"));
    const result = DocsRules.check(root);
    writeFileSync(
      join(directory, "docs-check.json"),
      JSON.stringify({ controls, ...result }, null, 2) + "\n",
    );
    for (const warning of result.warnings) {
      console.warn(`warning [${warning.rule}] ${warning.file}: ${warning.message}`);
    }
    if (result.failures.length > 0) {
      for (const failure of result.failures) {
        console.error(`[${failure.rule}] ${failure.file}: ${failure.message}`);
      }
      console.error(
        `Documentation check failed: ${result.failures.length} finding(s). Report: ${directory}`,
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      `Documentation check passed: ${controls.length} negative controls observed failing, repository clean. Report: ${directory}`,
    );
  }

  /** Proves the valid sample passes and each mutation trips exactly its intended rule class. */
  private static runControls(samples: string): string[] {
    const valid = DocsRules.check(DocsVerification.writeSample(join(samples, "valid"), {}));
    assert.deepEqual(valid, { failures: [], warnings: [] }, "valid documentation sample must pass");
    const observed: string[] = [];
    for (const control of DocsVerification.controls()) {
      const sample = DocsVerification.writeSample(
        join(samples, control.name.replace(/[^a-z0-9]+/gi, "-")),
        control.files,
      );
      const result = DocsRules.check(sample);
      const findings = control.isWarning === true ? result.warnings : result.failures;
      assert.ok(
        findings.length > 0 && findings.every((finding) => finding.rule === control.rule),
        `${control.name}: expected only ${control.rule} findings, got ${JSON.stringify(result)}`,
      );
      if (control.isWarning === true)
        assert.deepEqual(result.failures, [], `${control.name}: warning only`);
      observed.push(control.name);
    }
    const archived = DocsVerification.writeSample(join(samples, "archived-exempt"), {
      ".docs/Archive/old-story/Brief.md": "# Old\n\nRan in /Users/someone/work.\n",
      ".docs/Archive/old-story/Plan.md": "# Old plan\n",
      ".docs/Archive/old-story/Tasks.md":
        "# Old tasks\n\n" + "x".repeat(TASKS_LIMIT_BYTES + 1) + "\n",
      ".docs/Archive/Index.md": "# Archive\n\n- [Old](old-story/Brief.md)\n",
    });
    assert.deepEqual(
      DocsRules.check(archived).failures,
      [],
      "archived stories are exempt from size/path limits",
    );
    return observed;
  }

  /** The rule mutations applied to the valid sample; `null` deletes a file. */
  private static controls(): IDocsControl[] {
    const story = ".docs/Stories/sample-story";
    const tasks = DocsVerification.tasksSample;
    const task = DocsVerification.taskSample;
    return [
      {
        name: "broken link",
        rule: "link",
        files: { ".docs/Home.md": "# Home\n\n[Gone](Missing.md)\n" },
      },
      {
        name: "broken anchor",
        rule: "link",
        files: { [`${story}/Brief.md`]: "# Sample - Brief\n\n[Approval](Plan.md#missing)\n" },
      },
      {
        name: "ADR missing section",
        rule: "adr",
        files: {
          ".docs/Architecture/Decisions/ADR-0001-Sample.md":
            "---\nstatus: accepted\n---\n\n# ADR-0001: Sample\n\n## Context\n\n## Decision\n",
        },
      },
      {
        name: "ADR not indexed",
        rule: "adr",
        files: { ".docs/Architecture/Decisions/Index.md": "# Decisions\n" },
      },
      { name: "story missing Tasks", rule: "story", files: { [`${story}/Tasks.md`]: null } },
      {
        name: "story not indexed",
        rule: "story",
        files: { ".docs/Stories/Index.md": "# Stories\n" },
      },
      {
        name: "duplicate task ID",
        rule: "tasks",
        files: {
          [`${story}/Tasks.md`]: tasks(
            task("T-001", "done", "None.") + task("T-001", "done", "None."),
          ),
        },
      },
      {
        name: "invalid task status",
        rule: "tasks",
        files: { [`${story}/Tasks.md`]: tasks(task("T-001", "started", "None.")) },
      },
      {
        name: "unknown task dependency",
        rule: "tasks",
        files: { [`${story}/Tasks.md`]: tasks(task("T-001", "pending", "T-009.")) },
      },
      {
        name: "task dependency cycle",
        rule: "tasks",
        files: {
          [`${story}/Tasks.md`]: tasks(
            task("T-001", "pending", "T-002.") + task("T-002", "pending", "T-001."),
          ),
        },
      },
      {
        name: "blocked task without blocker",
        rule: "tasks",
        files: { [`${story}/Tasks.md`]: tasks(task("T-001", "blocked", "None.")) },
      },
      {
        name: "spaced date token outside templates",
        rule: "template",
        files: { ".docs/Home.md": "---\ncreated: { { date:YYYY-MM-DD } }\n---\n\n# Home\n" },
      },
      {
        name: "title placeholder outside templates",
        rule: "template",
        files: { ".docs/Home.md": "# [Story title] - Brief\n" },
      },
      {
        name: "zero ADR number outside templates",
        rule: "template",
        files: { ".docs/Home.md": "# Home\n\nSee ADR-0000.\n" },
      },
      {
        name: "spaced date token inside templates",
        rule: "template",
        files: { ".docs/Templates/Story Brief.md": "---\ncreated: { { date:YYYY-MM-DD } }\n---\n" },
      },
      {
        name: "oversized active Tasks",
        rule: "story-size",
        files: {
          [`${story}/Tasks.md`]: tasks(
            task("T-001", "done", "None.") + "x".repeat(TASKS_LIMIT_BYTES),
          ),
        },
      },
      {
        name: "large active Plan warning",
        rule: "story-size",
        isWarning: true,
        files: {
          [`${story}/Plan.md`]:
            "# Sample - Plan\n\n## Approval\n\n" + "x".repeat(PLAN_WARNING_BYTES) + "\n",
        },
      },
      {
        name: "machine path in active story",
        rule: "machine-path",
        files: { [`${story}/Brief.md`]: "# Sample - Brief\n\nRan in C:\\work\\glacier.\n" },
      },
      {
        name: "skill name mismatch",
        rule: "skill",
        files: { ".github/skills/sample-skill/SKILL.md": "---\nname: other-skill\n---\n" },
      },
    ];
  }

  /** Wraps task records in a sample Tasks document. */
  private static tasksSample(this: void, body: string): string {
    return `# Sample - Tasks\n\n## Task records\n\n${body}`;
  }

  /** Renders one sample task record with no blocker. */
  private static taskSample(this: void, id: string, status: string, dependencies: string): string {
    return `### ${id} - Do ${id}\n\n- Status: ${status}\n- Dependencies: ${dependencies}\n- Blocker: None.\n\n`;
  }

  /** Writes the valid sample repository with overrides applied and returns its root. */
  private static writeSample(
    root: string,
    overrides: Readonly<Record<string, string | null>>,
  ): string {
    const story = ".docs/Stories/sample-story";
    const files: Record<string, string | null> = {
      "AGENTS.md": "# Agents\n\n[Home](.docs/Home.md)\n",
      ".docs/Home.md":
        "# Home\n\n[Decisions](Architecture/Decisions/Index.md), [Stories](Stories/Index.md)\n",
      ".docs/Architecture/Decisions/Index.md": "# Decisions\n\n- [ADR-0001](ADR-0001-Sample.md)\n",
      ".docs/Architecture/Decisions/ADR-0001-Sample.md":
        "---\nstatus: accepted\n---\n\n# ADR-0001: Sample\n\n## Context\n\n## Decision\n\n## Consequences\n",
      ".docs/Stories/Index.md": "# Stories\n\n- [Sample](sample-story/Brief.md)\n",
      ".docs/Archive/Index.md": "# Archive\n",
      [`${story}/Brief.md`]: "# Sample - Brief\n\n[Approval](Plan.md#approval)\n",
      [`${story}/Plan.md`]: "# Sample - Plan\n\n## Approval\n\nApproved.\n",
      [`${story}/Tasks.md`]:
        "# Sample - Tasks\n\n### T-001 - Do it\n\n- Status: done\n- Dependencies: None.\n- Blocker: None.\n\n" +
        "### T-002 - Then\n\n- Status: pending\n- Dependencies: T-001.\n- Blocker: None.\n",
      ".docs/Templates/Story Brief.md":
        "---\ncreated: {{date:YYYY-MM-DD}}\n---\n\n# [Story title] - Brief\n\n[plan](Plan.md#approval)\n",
      ".github/skills/sample-skill/SKILL.md": "---\nname: sample-skill\n---\n\n# Sample skill\n",
      ...overrides,
    };
    for (const [path, contents] of Object.entries(files)) {
      if (contents === null) continue;
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), contents);
    }
    return root;
  }
}

await DocsVerification.run();
