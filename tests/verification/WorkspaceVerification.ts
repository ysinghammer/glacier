import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { ReportDirectoryService } from "../reporting/ReportDirectory.service.js";

/** Retains command outcomes without storing environment variables or credentials. */
interface ICommandEvidence {
  readonly command: string;
  readonly status: number;
  readonly output: string;
}

/** Verifies install reproducibility, actual Turbo gates, and Husky behavior in a disposable repository. */
class WorkspaceVerification {
  /** Runs clean/negative controls without staging or changing files in the user's checkout. */
  public static async run(): Promise<void> {
    const source = process.cwd();
    const directory = await ReportDirectoryService.create(source, "tooling-verification");
    const root = await mkdtemp(join(tmpdir(), "glacier-workspace-"));
    const evidence: ICommandEvidence[] = [];
    try {
      const files = [
        "package.json",
        "pnpm-workspace.yaml",
        "pnpm-lock.yaml",
        ".node-version",
        ".nvmrc",
        "turbo.json",
        "tsconfig.base.json",
        "tsconfig.json",
        ".oxlintrc.json",
        ".gitignore",
        ".oxfmtignore",
        ".husky/pre-commit",
      ];
      for (const path of files) {
        await mkdir(dirname(join(root, path)), { recursive: true });
        await copyFile(join(source, path), join(root, path));
      }
      WorkspaceVerification.command(root, "git", ["init", "--quiet"], true, evidence);
      const lockfileBefore = await WorkspaceVerification.digest(join(root, "pnpm-lock.yaml"));
      const manifestBefore = await WorkspaceVerification.digest(join(root, "package.json"));
      WorkspaceVerification.command(
        root,
        "pnpm",
        ["install", "--offline", "--frozen-lockfile"],
        true,
        evidence,
      );
      assert.equal(
        await WorkspaceVerification.digest(join(root, "pnpm-lock.yaml")),
        lockfileBefore,
        "frozen install changed lockfile",
      );
      assert.equal(
        await WorkspaceVerification.digest(join(root, "package.json")),
        manifestBefore,
        "frozen install changed manifest",
      );
      await mkdir(join(root, "tests/fixture"), { recursive: true });
      const fixture = join(root, "tests/fixture/Fixture.ts");
      const valid = "export const FIXTURE = 1;\n";
      await writeFile(fixture, valid);
      WorkspaceVerification.command(
        root,
        "pnpm",
        [
          "exec",
          "turbo",
          "run",
          "lint:root",
          "format-check:root",
          "type-check:root",
          "build:root",
          "--force",
        ],
        true,
        evidence,
      );
      await writeFile(fixture, "debugger;\nexport const FIXTURE = 1;\n");
      const lint = WorkspaceVerification.command(
        root,
        "pnpm",
        ["exec", "turbo", "run", "lint:root", "--force"],
        false,
        evidence,
      );
      assert.match(lint.output, /no-debugger/);
      await writeFile(fixture, "export const FIXTURE={value:1}\n");
      const format = WorkspaceVerification.command(
        root,
        "pnpm",
        ["exec", "turbo", "run", "format-check:root", "--force"],
        false,
        evidence,
      );
      assert.match(format.output, /Fixture\.ts/);
      await writeFile(fixture, 'export const FIXTURE: number = "invalid";\n');
      const typeCheck = WorkspaceVerification.command(
        root,
        "pnpm",
        ["exec", "turbo", "run", "type-check:root", "--force"],
        false,
        evidence,
      );
      assert.match(typeCheck.output, /TS2322/);
      WorkspaceVerification.verifyCompilerOptions(root, evidence);
      await WorkspaceVerification.verifyStrictControls(root, fixture, evidence);
      await writeFile(fixture, valid);
      const unstaged = join(root, "unrelated.txt");
      await writeFile(unstaged, "unrelated unstaged contents\n");
      WorkspaceVerification.command(
        root,
        "git",
        ["add", "tests/fixture/Fixture.ts"],
        true,
        evidence,
      );
      WorkspaceVerification.command(root, "sh", [".husky/_/pre-commit"], true, evidence);
      await writeFile(fixture, "debugger;\nexport const FIXTURE = 1;\n");
      WorkspaceVerification.command(
        root,
        "git",
        ["add", "tests/fixture/Fixture.ts"],
        true,
        evidence,
      );
      const invalidHook = WorkspaceVerification.command(
        root,
        "sh",
        [".husky/_/pre-commit"],
        false,
        evidence,
      );
      assert.match(invalidHook.output, /no-debugger/);
      await writeFile(fixture, "export const FIXTURE={value:1}\n");
      WorkspaceVerification.command(
        root,
        "git",
        ["add", "tests/fixture/Fixture.ts"],
        true,
        evidence,
      );
      const formatHook = WorkspaceVerification.command(
        root,
        "sh",
        [".husky/_/pre-commit"],
        false,
        evidence,
      );
      assert.match(formatHook.output, /Fixture\.ts/);
      await writeFile(fixture, valid);
      WorkspaceVerification.command(
        root,
        "git",
        ["add", "tests/fixture/Fixture.ts"],
        true,
        evidence,
      );
      const partialContents = valid + "// Unstaged edit on the same file\n";
      await writeFile(fixture, partialContents);
      WorkspaceVerification.command(root, "sh", [".husky/_/pre-commit"], true, evidence);
      assert.equal(
        await readFile(fixture, "utf8"),
        partialContents,
        "hook rewrote a partially staged file",
      );
      assert.equal(
        await readFile(unstaged, "utf8"),
        "unrelated unstaged contents\n",
        "hook rewrote unrelated unstaged work",
      );
      const staged = WorkspaceVerification.command(
        root,
        "git",
        ["show", ":tests/fixture/Fixture.ts"],
        true,
        evidence,
      );
      assert.equal(staged.output, valid, "hook changed the staged version");
      console.log(
        "Workspace fixtures passed: frozen clean install, Turbo positive/negative gates, strict compiler controls, and actual Husky staged-file checks.",
      );
    } finally {
      try {
        await writeFile(join(directory, "commands.json"), JSON.stringify(evidence, null, 2) + "\n");
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  }

  /** Requires the exact mandated compiler options in the resolved config, with no path aliases. */
  private static verifyCompilerOptions(root: string, evidence: ICommandEvidence[]): void {
    const result = WorkspaceVerification.command(
      root,
      "pnpm",
      ["exec", "tsc", "--project", "tsconfig.json", "--showConfig"],
      true,
      evidence,
    );
    const value: unknown = JSON.parse(result.output);
    assert.ok(typeof value === "object" && value !== null && "compilerOptions" in value);
    const options = value.compilerOptions;
    assert.ok(typeof options === "object" && options !== null);
    for (const option of [
      "strict",
      "noUncheckedIndexedAccess",
      "exactOptionalPropertyTypes",
      "noImplicitOverride",
      "noUnusedLocals",
      "noUnusedParameters",
      "noFallthroughCasesInSwitch",
    ]) {
      assert.ok(
        option in options && Reflect.get(options, option) === true,
        `compiler option ${option} is not enabled`,
      );
    }
    assert.equal("paths" in options, false, "internal aliases are forbidden");
  }

  /** Proves strictness controls produce their expected diagnostics rather than unrelated startup failures. */
  private static async verifyStrictControls(
    root: string,
    fixture: string,
    evidence: ICommandEvidence[],
  ): Promise<void> {
    const controls = [
      {
        name: "strict null checks",
        source: "export const FIXTURE: string = undefined;\n",
        diagnostic: "TS2322",
      },
      {
        name: "unchecked indexed access",
        source: "const values: number[] = [];\nexport const FIXTURE: number = values[0];\n",
        diagnostic: "TS2322",
      },
      {
        name: "exact optional properties",
        source:
          "interface IFixture { value?: string; }\nexport const FIXTURE: IFixture = { value: undefined };\n",
        diagnostic: "TS2375",
      },
      {
        name: "explicit overrides",
        source:
          "class Base { run(): void {} }\nexport class Fixture extends Base { run(): void {} }\n",
        diagnostic: "TS4114",
      },
      {
        name: "unused locals",
        source: "const unused = 1;\nexport const FIXTURE = 1;\n",
        diagnostic: "TS6133",
      },
      {
        name: "unused parameters",
        source: "export class Fixture { public static run(unused: string): void {} }\n",
        diagnostic: "TS6133",
      },
      {
        name: "switch fallthrough",
        source:
          "export class Fixture { public static run(value: number): void { switch (value) { case 1: console.log(value); case 2: break; } } }\n",
        diagnostic: "TS7029",
      },
    ];
    for (const control of controls) {
      await writeFile(fixture, control.source);
      const result = WorkspaceVerification.command(
        root,
        "pnpm",
        ["exec", "turbo", "run", "type-check:root", "--force"],
        false,
        evidence,
      );
      assert.ok(
        result.output.includes(control.diagnostic),
        `${control.name}: expected ${control.diagnostic}`,
      );
    }
  }

  /** Captures only process output and exit status; infrastructure failures cannot satisfy negative assertions. */
  private static command(
    root: string,
    executable: string,
    args: readonly string[],
    isExpectedSuccess: boolean,
    evidence: ICommandEvidence[],
  ): ICommandEvidence {
    const result = spawnSync(executable, args, {
      cwd: root,
      encoding: "utf8",
      timeout: 120_000,
      env: { ...process.env, HUSKY: "1", TURBO_TELEMETRY_DISABLED: "1", NO_COLOR: "1" },
    });
    if (result.error) throw new Error(`Unable to run ${executable}`, { cause: result.error });
    if (result.status === null) throw new Error(`${executable} terminated by ${result.signal}`);
    const record = {
      command: [executable, ...args].join(" "),
      status: result.status,
      output: result.stdout + result.stderr,
    };
    evidence.push(record);
    assert.equal(result.status === 0, isExpectedSuccess, `${record.command}\n${record.output}`);
    return record;
  }

  /** Detects manifest/lockfile drift during a clean frozen installation. */
  private static async digest(path: string): Promise<string> {
    return createHash("sha256")
      .update(await readFile(path))
      .digest("hex");
  }
}

await WorkspaceVerification.run();
