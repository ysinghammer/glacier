import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BuildInventory } from "../../data/BuildInventory.js";
import { TypeScriptCompiler } from "../../data/TypeScriptCompiler.js";

/** Isolated test-owned TypeScript project and its generated outputs. */
class InventoryProject {
  /** Absolute fixture directory under the package's generated artifacts. */
  public readonly root: string;

  /** Creates an independent production-shaped project and compiles its inputs. */
  public constructor() {
    const artifacts = resolve("tests/artifacts");
    mkdirSync(artifacts, { recursive: true });
    this.root = mkdtempSync(resolve(artifacts, "inventory-"));
    this.write("package.json", JSON.stringify({ type: "module" }));
    this.write("index.ts", 'export { Example } from "./src/Example.js";\n');
    this.write("src/Example.ts", "export class Example {}\n");
    this.write("src/Unused.ts", "export class Unused { public static value() { return 1; } }\n");
    this.write("src/Type.ts", "export interface Type { readonly value: string }\n");
    this.configure(["index.ts", "src/**/*.ts"]);
    this.compile();
  }

  /**
   * Writes test-owned input or output without deleting unrelated paths.
   * @param path Fixture-relative path to write.
   * @param contents Complete UTF-8 file contents.
   * @returns No value after writing the file.
   */
  public write(path: string, contents: string): void {
    const target = resolve(this.root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }

  /**
   * Sets fixture compiler includes while preserving the expected output roots.
   * @param includes Production input globs to configure.
   * @returns No value after writing the configuration.
   */
  public configure(includes: readonly string[]): void {
    this.write(
      "tsconfig.json",
      JSON.stringify({
        compilerOptions: {
          rootDir: ".",
          outDir: "dist",
          target: "ES2023",
          module: "ESNext",
          moduleResolution: "Bundler",
          types: [],
        },
        include: includes,
      }),
    );
  }

  /**
   * Emits the fixture using the TypeScript compiler without removing prior outputs.
   * @returns No value after generated files have been written.
   */
  public compile(): void {
    TypeScriptCompiler.run(this.root, ["--project", "tsconfig.json"]);
  }
}

describe("production build inventory", () => {
  it("accepts all matching outputs including type-only and otherwise unused inputs", () => {
    const project = new InventoryProject();
    expect(() => BuildInventory.verify(project.root)).not.toThrow();
    expect(readFileSync(resolve(project.root, "dist/src/Unused.js"), "utf8")).toContain("Unused");
    expect(readFileSync(resolve(project.root, "dist/src/Type.js"), "utf8")).toContain("export");
    const artifacts = resolve(project.root, "tests/artifacts");
    const references = readdirSync(artifacts).filter((name) =>
      name.startsWith("inventory-reference-"),
    );
    expect(references).toHaveLength(1);
    const reference = references[0];
    if (reference === undefined) throw new Error("Reference output was not generated");
    expect(readFileSync(resolve(artifacts, reference, "src/Unused.js"), "utf8")).toContain(
      "Unused",
    );
  });

  it("reports a missing output without deleting fresh generated files", () => {
    const project = new InventoryProject();
    project.write("src/New.ts", "export class New {}\n");
    expect(() => BuildInventory.verify(project.root)).toThrow("Missing emitted JavaScript");
    expect(readFileSync(resolve(project.root, "src/New.ts"), "utf8")).toContain("New");
    expect(readFileSync(resolve(project.root, "dist/src/Unused.js"), "utf8")).toContain("Unused");
  });

  it("rejects unexpected stale output and leaves it untouched", () => {
    const project = new InventoryProject();
    project.write("dist/src/Old.js", "export const old = true;\n");
    expect(() => BuildInventory.verify(project.root)).toThrow("Unexpected emitted JavaScript");
    expect(readFileSync(resolve(project.root, "dist/src/Old.js"), "utf8")).toContain("old");
  });

  it("detects stale JavaScript contents even when every output path exists", () => {
    const project = new InventoryProject();
    project.write("src/Example.ts", "export class Example { public changed = true; }\n");
    expect(() => BuildInventory.verify(project.root)).toThrow("Stale emitted JavaScript");
    expect(readFileSync(resolve(project.root, "dist/src/Example.js"), "utf8")).not.toContain(
      "changed",
    );
  });

  it("rejects compiler includes that omit an inventoried source", () => {
    const project = new InventoryProject();
    project.configure(["index.ts"]);
    expect(() => BuildInventory.verify(project.root)).toThrow("Production includes");
  });

  it("rejects a compiler root directory that changes the output mapping", () => {
    const project = new InventoryProject();
    project.write(
      "tsconfig.json",
      JSON.stringify({
        compilerOptions: { rootDir: "src", outDir: "dist" },
        include: ["index.ts", "src/**/*.ts"],
      }),
    );
    expect(() => BuildInventory.verify(project.root)).toThrow("rootDir and outDir");
  });

  it("checks a declared CLI source and output against compiler inputs", () => {
    const project = new InventoryProject();
    project.write(
      "package.json",
      JSON.stringify({ type: "module", bin: { example: "dist/cli.js" } }),
    );
    project.write("cli.ts", 'console.log("example");\n');
    expect(() => BuildInventory.verify(project.root)).toThrow("Production includes");
    project.configure(["index.ts", "src/**/*.ts", "cli.ts"]);
    expect(() => BuildInventory.verify(project.root)).toThrow("Missing emitted JavaScript");
    project.compile();
    expect(() => BuildInventory.verify(project.root)).not.toThrow();
  });

  it("rejects CLI paths outside the emitted inventory", () => {
    const project = new InventoryProject();
    project.write("package.json", JSON.stringify({ bin: "../cli.js" }));
    expect(() => BuildInventory.verify(project.root)).toThrow("Declared CLI");
  });
});
