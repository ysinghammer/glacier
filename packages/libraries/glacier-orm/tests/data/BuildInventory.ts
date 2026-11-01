import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { TypeScriptCompiler } from "./TypeScriptCompiler.ts";

/** Production compiler settings and the inputs expanded by TypeScript. */
interface ICompilerProject {
  /** Compiler root directory as interpreted relative to the project. */
  readonly rootDir: string;
  /** Compiler output directory as interpreted relative to the project. */
  readonly outDir: string;
  /** Source files expanded by the compiler's include rules. */
  readonly files: readonly string[];
}

/** Checks production inputs against all JavaScript outputs without changing either tree. */
export class BuildInventory {
  /**
   * Validates compiler inputs, declared CLI outputs, emitted paths, and current output contents.
   * @param root Absolute or relative package directory containing its production configuration.
   * @returns No value; throws when the inventory or generated contents do not match.
   */
  public static verify(root: string): void {
    const packageRoot = resolve(root);
    const configuration = this.configuration(packageRoot);
    const sources = this.sources(packageRoot);
    this.verifyConfiguration(packageRoot, configuration, sources);
    const expected = this.expectedOutputs(packageRoot, sources);
    this.verifyCli(packageRoot, expected);
    this.verifyPaths(packageRoot, expected);
    this.verifyContents(packageRoot, expected);
  }

  /**
   * Loads the production TypeScript project using the same compiler as its build.
   * @param root Absolute package directory.
   * @returns Parsed compiler configuration and its production input paths.
   * @throws {Error} When the configuration cannot be read or contains errors.
   */
  private static configuration(root: string): ICompilerProject {
    const value: unknown = JSON.parse(
      TypeScriptCompiler.run(root, ["--project", "tsconfig.json", "--showConfig"]),
    );
    if (
      typeof value !== "object" ||
      value === null ||
      !("compilerOptions" in value) ||
      !("files" in value)
    ) {
      throw new Error("Invalid production TypeScript configuration");
    }
    const options = value.compilerOptions;
    if (
      typeof options !== "object" ||
      options === null ||
      !("rootDir" in options) ||
      !("outDir" in options)
    ) {
      throw new Error("Production TypeScript configuration must specify rootDir and outDir");
    }
    if (typeof options.rootDir !== "string" || typeof options.outDir !== "string") {
      throw new Error("Invalid production TypeScript output roots");
    }
    if (
      !Array.isArray(value.files) ||
      !value.files.every((path: unknown) => typeof path === "string")
    ) {
      throw new Error("Invalid production TypeScript input inventory");
    }
    return {
      rootDir: resolve(root, options.rootDir),
      outDir: resolve(root, options.outDir),
      files: value.files,
    };
  }

  /**
   * Enumerates source inputs independently from TypeScript's include expansion.
   * @param root Absolute package directory.
   * @returns Sorted absolute paths to the root entry, CLI entries, and source files.
   * @throws {Error} When a declared CLI path is outside dist or is not JavaScript.
   */
  private static sources(root: string): string[] {
    const sources = [resolve(root, "index.ts"), ...this.files(resolve(root, "src"), ".ts")];
    for (const path of this.cliPaths(root)) {
      const output = resolve(root, path);
      const inside = relative(resolve(root, "dist"), output);
      if (isAbsolute(path) || inside.startsWith(`..${sep}`) || !inside.endsWith(".js")) {
        throw new Error("Declared CLI must identify a dist JavaScript output");
      }
      sources.push(resolve(root, inside.replace(/\.js$/, ".ts")));
    }
    return [...new Set(sources.filter((path) => !path.endsWith(".d.ts")))].sort();
  }

  /**
   * Lists matching regular files recursively and rejects symlinks to avoid hidden inputs.
   * @param directory Absolute directory to enumerate.
   * @param extension Required filename suffix.
   * @returns Absolute matching file paths.
   * @throws {Error} When a symbolic link occurs in the inventoried tree.
   */
  private static files(directory: string, extension: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Symbolic link in build inventory: ${path}`);
      }
      if (entry.isDirectory()) {
        results.push(...this.files(path, extension));
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        results.push(path);
      }
    }
    return results;
  }

  /**
   * Requires the actual compiler input set and output roots to match the inventory.
   * @param root Absolute package directory.
   * @param configuration Parsed production project.
   * @param sources Independently discovered TypeScript inputs.
   * @returns No value when the configuration matches.
   * @throws {Error} When compiler roots or selected production inputs differ.
   */
  private static verifyConfiguration(
    root: string,
    configuration: ICompilerProject,
    sources: readonly string[],
  ): void {
    if (configuration.rootDir !== root || configuration.outDir !== resolve(root, "dist")) {
      throw new Error("Production rootDir and outDir must be the package root and dist");
    }
    const actual = configuration.files
      .map((path) => resolve(root, path))
      .filter((path) => !path.endsWith(".d.ts"))
      .sort();
    if (JSON.stringify(actual) !== JSON.stringify(sources)) {
      throw new Error("Production includes must select index.ts and every src TypeScript file");
    }
  }

  /**
   * Maps each source to its expected JavaScript path under dist.
   * @param root Absolute package directory.
   * @param sources Discovered non-declaration TypeScript inputs.
   * @returns Expected output paths in a set.
   */
  private static expectedOutputs(root: string, sources: readonly string[]): Set<string> {
    return new Set(
      sources.map((source) =>
        resolve(root, "dist", relative(root, source).replace(/\.ts$/, ".js")),
      ),
    );
  }

  /**
   * Checks that any declared CLI points to an inventoried output without path traversal.
   * @param root Absolute package directory.
   * @param expected Expected JavaScript outputs.
   * @returns No value when every declared CLI has a source input.
   */
  private static verifyCli(root: string, expected: ReadonlySet<string>): void {
    for (const path of this.cliPaths(root)) {
      this.verifyCliPath(root, expected, path);
    }
  }

  /**
   * Reads all declared executable paths without interpreting them as trusted paths.
   * @param root Absolute package directory.
   * @returns Declared executable paths, or an empty list when no CLI is declared.
   * @throws {Error} When the bin declaration is malformed.
   */
  private static cliPaths(root: string): string[] {
    const manifest: unknown = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    if (typeof manifest !== "object" || manifest === null || !("bin" in manifest)) return [];
    const bin = manifest.bin;
    if (typeof bin === "string") return [bin];
    if (typeof bin !== "object" || bin === null || Array.isArray(bin)) {
      throw new Error("Invalid package bin declaration");
    }
    const paths = Object.values(bin);
    if (paths.length === 0) throw new Error("Empty package bin declaration");
    if (!paths.every((path): path is string => typeof path === "string")) {
      throw new Error("Invalid package bin declaration");
    }
    return paths;
  }

  /**
   * Validates one CLI path against the exact generated output inventory.
   * @param root Absolute package directory.
   * @param expected Expected JavaScript outputs.
   * @param path Package-relative executable path.
   * @returns No value when the declared path is inventoried.
   * @throws {Error} When the path escapes dist or does not identify a production output.
   */
  private static verifyCliPath(root: string, expected: ReadonlySet<string>, path: string): void {
    const output = resolve(root, path);
    const inside = relative(resolve(root, "dist"), output);
    if (isAbsolute(path) || inside.startsWith(`..${sep}`) || !expected.has(output)) {
      throw new Error("Declared CLI must identify an inventoried dist JavaScript output");
    }
  }

  /**
   * Compares both directions of the source-to-output inventory.
   * @param root Absolute package directory.
   * @param expected Expected JavaScript outputs.
   * @returns No value when every path is present and no additional JavaScript exists.
   * @throws {Error} When an expected output is absent or an unexpected output remains.
   */
  private static verifyPaths(root: string, expected: ReadonlySet<string>): void {
    const directory = resolve(root, "dist");
    if (!existsSync(directory)) throw new Error("Missing dist directory");
    const actual = new Set(this.files(directory, ".js"));
    for (const path of expected) {
      if (!actual.has(path)) throw new Error(`Missing emitted JavaScript: ${relative(root, path)}`);
    }
    for (const path of actual) {
      if (!expected.has(path))
        throw new Error(`Unexpected emitted JavaScript: ${relative(root, path)}`);
    }
  }

  /**
   * Compiles to a new artifact directory and compares every JavaScript output byte-for-byte.
   * @param root Absolute package directory.
   * @param expected Expected JavaScript output paths.
   * @returns No value when the existing build matches a fresh compilation.
   * @throws {Error} When generated JavaScript is stale, absent, or unexpectedly emitted.
   */
  private static verifyContents(root: string, expected: ReadonlySet<string>): void {
    const artifacts = resolve(root, "tests/artifacts");
    mkdirSync(artifacts, { recursive: true });
    const reference = mkdtempSync(resolve(artifacts, "inventory-reference-"));
    TypeScriptCompiler.run(root, ["--project", "tsconfig.json", "--outDir", reference]);
    const output = new Set(this.files(reference, ".js"));
    for (const path of expected) {
      const fresh = resolve(reference, relative(resolve(root, "dist"), path));
      if (!output.has(fresh) || readFileSync(path, "utf8") !== readFileSync(fresh, "utf8")) {
        throw new Error(`Stale emitted JavaScript: ${path}`);
      }
    }
    for (const path of output) {
      if (!expected.has(resolve(root, "dist", relative(reference, path)))) {
        throw new Error(`Unexpected compiler output: ${path}`);
      }
    }
  }
}
