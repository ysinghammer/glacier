import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { TypeScriptCompiler } from "../../data/TypeScriptCompiler.js";

/** Test-owned executable project used to check emitted coverage accounting. */
class CoverageProject {
  /** Absolute artifact directory containing the isolated project. */
  private readonly root: string;

  /**
   * Builds a fixture whose package root and executable both call one emitted module.
   * @param isBranchMissing Whether the CLI omits the true branch.
   * @param hasUnusedFile Whether a second emitted file is never executed.
   */
  public constructor(isBranchMissing: boolean, hasUnusedFile: boolean) {
    const artifacts = resolve("tests/artifacts");
    mkdirSync(artifacts, { recursive: true });
    this.root = mkdtempSync(resolve(artifacts, "emitted-coverage-"));
    this.write(
      "package.json",
      JSON.stringify({
        name: "@fixture/emitted-coverage",
        type: "module",
        exports: { ".": "./dist/index.js" },
        bin: { fixture: "dist/cli.js" },
      }),
    );
    this.write(
      "tsconfig.json",
      JSON.stringify({
        compilerOptions: {
          rootDir: ".",
          outDir: "dist",
          target: "ES2023",
          module: "NodeNext",
          types: [],
        },
        include: ["index.ts", "cli.ts", "src/**/*.ts"],
      }),
    );
    this.write("index.ts", 'export { Decision } from "./src/Decision.js";\n');
    this.write(
      "src/Decision.ts",
      "export class Decision { public static choose(value: boolean): number { return value ? 1 : 0; } }\n",
    );
    this.write(
      "cli.ts",
      `import { Decision } from "./index.js";\nconsole.log(Decision.choose(${!isBranchMissing}));\n`,
    );
    if (hasUnusedFile)
      this.write(
        "src/Unused.ts",
        "export class Unused { public static value(): number { return 7; } }\n",
      );
    this.write(
      "tests/scenarios/Fixture.test.ts",
      [
        'import { execFileSync } from "node:child_process";',
        'import { expect, it } from "vitest";',
        'import { Decision } from "@fixture/emitted-coverage";',
        'it("executes the built package root and CLI", () => {',
        "  expect(Decision.choose(false)).toBe(0);",
        `  expect(execFileSync(process.execPath, ["dist/cli.js"], { encoding: "utf8" }).trim()).toBe("${isBranchMissing ? 0 : 1}");`,
        "});\n",
      ].join("\n"),
    );
    this.write(
      "vitest.config.mjs",
      [
        "export default { test: {",
        '  include: ["tests/scenarios/**/*.test.ts"], pool: "forks",',
        "  server: { deps: { external: [/\\/dist\\//] } },",
        "  coverage: {",
        '    provider: "v8", include: ["dist/**/*.js"], autoAttachSubprocess: true,',
        '    reporter: ["text", "json-summary"], thresholds: { lines: 100, statements: 100, branches: 100, functions: 100, perFile: true },',
        "  },",
        "} };\n",
      ].join("\n"),
    );
    TypeScriptCompiler.run(this.root, ["--project", "tsconfig.json"]);
  }

  /**
   * Runs the isolated Vitest project with V8 coverage and captures its diagnostics.
   * @returns Process exit status and combined test output.
   * @throws {Error} When the subprocess cannot start or times out.
   */
  public run(): { status: number | null; output: string } {
    const require = createRequire(import.meta.url);
    const executable = resolve(dirname(require.resolve("vitest/package.json")), "vitest.mjs");
    const result = spawnSync(process.execPath, [executable, "run", "--coverage"], {
      cwd: this.root,
      encoding: "utf8",
      timeout: 30_000,
    });
    if (result.error !== undefined) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr };
  }

  /**
   * Writes one generated fixture file, retaining all other files and directories.
   * @param path Project-relative file path.
   * @param contents Complete UTF-8 contents.
   * @returns No value after the file is written.
   */
  private write(path: string, contents: string): void {
    const target = resolve(this.root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
}

describe("emitted JavaScript coverage accounting", () => {
  it("combines the built root and spawned CLI against the same emitted file", () => {
    const result = new CoverageProject(false, false).run();
    expect(result.status).toBe(0);
    expect(result.output).toContain("Decision.js");
    expect(result.output).toContain("cli.js");
    expect(result.output).toMatch(/All files\s*\|\s*100\s*\|\s*100\s*\|\s*100\s*\|\s*100/);
  }, 60_000);

  it("fails a deliberately uncovered branch even when both entry points run", () => {
    const result = new CoverageProject(true, false).run();
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("Decision.js");
    expect(result.output).toContain("Coverage for branches");
  }, 60_000);

  it("fails an untested emitted executable file instead of omitting it", () => {
    const result = new CoverageProject(false, true).run();
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("Unused.js");
    expect(result.output).toContain("Coverage for statements");
  }, 60_000);
});
