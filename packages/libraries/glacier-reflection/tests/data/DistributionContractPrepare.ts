import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

interface IDistributionEntry {
  readonly import: string;
  readonly types: string;
}

/** Builds an isolated consumer containing only the copied distribution and its authored fixtures. */
export class DistributionContractPrepare {
  /** Runs existing installed tools with bounded completion and preserved diagnostics. */
  private static command(arguments_: readonly string[]): void {
    const result = spawnSync("pnpm", [...arguments_], {
      cwd: new URL("../..", import.meta.url),
      stdio: "inherit",
      timeout: 120_000,
    });
    if (result.error !== undefined) throw result.error;
    if (result.status !== 0)
      throw new Error(`Distribution preparation failed: ${arguments_.join(" ")}`);
  }

  /** Copies generated public entries, verifies independent declarations and builds four real bundles. */
  public static async run(): Promise<void> {
    const consumer = new URL("../artifacts/distribution/consumer/", import.meta.url);
    const packageDirectory = new URL("node_modules/@glacier/reflection/", consumer);
    await rm(consumer, { recursive: true, force: true });
    await mkdir(packageDirectory, { recursive: true });
    await cp(new URL("../../dist/", import.meta.url), new URL("dist/", packageDirectory), {
      recursive: true,
    });
    await cp(
      new URL("../../package.json", import.meta.url),
      new URL("package.json", packageDirectory),
    );
    await writeFile(
      new URL("package.json", consumer),
      JSON.stringify({ private: true, type: "module" }),
    );
    for (const name of [
      "DistributionContractProbe",
      "DistributionConsumer",
      "DistributionTypeOnly",
      "DistributionRetained",
      "DistributionRootOnly",
      "DistributionOrdinaryMetadata",
      "DistributionSharedMetadata",
      "UnregisteredCompilerFixture",
      "RecordedCompilerFixture",
      "CompilerFixtureDecoration",
    ]) {
      await cp(
        new URL(`../artifacts/compiler/${name}.js`, import.meta.url),
        new URL(`${name}.js`, consumer),
      );
    }
    const duplicate = new URL("duplicate/", consumer);
    await mkdir(duplicate, { recursive: true });
    await cp(packageDirectory, new URL("node_modules/@glacier/reflection/", duplicate), {
      recursive: true,
    });
    await writeFile(
      new URL("package.json", duplicate),
      JSON.stringify({ private: true, type: "module" }),
    );
    await writeFile(new URL("root.js", duplicate), 'import "@glacier/reflection";\n');
    await writeFile(new URL("register.js", duplicate), 'import "@glacier/reflection/register";\n');
    await cp(
      new URL("../contracts/DistributionTypes.test-d.ts", import.meta.url),
      new URL("DistributionTypes.test-d.ts", consumer),
    );
    await writeFile(
      new URL("tsconfig.json", consumer),
      JSON.stringify({
        compilerOptions: {
          target: "ES2023",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          noUncheckedIndexedAccess: true,
          exactOptionalPropertyTypes: true,
          noImplicitOverride: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
          types: [],
          lib: ["ES2023"],
          noEmit: true,
          verbatimModuleSyntax: true,
        },
        include: ["DistributionTypes.test-d.ts"],
      }),
    );
    this.command(["exec", "tsc", "--project", fileURLToPath(new URL("tsconfig.json", consumer))]);
    const manifest: unknown = JSON.parse(
      await readFile(new URL("package.json", packageDirectory), "utf8"),
    );
    const { root, registration } = DistributionContractPrepare.#validateManifest(manifest);
    const resolution = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        'process.stdout.write(JSON.stringify([import.meta.resolve("@glacier/reflection"), import.meta.resolve("@glacier/reflection/register")]))',
      ],
      { cwd: consumer, encoding: "utf8", timeout: 8_000 },
    );
    if (resolution.error !== undefined) throw resolution.error;
    const expectedRoot = new URL(root.import, packageDirectory).href;
    const expectedRegistration = new URL(registration.import, packageDirectory).href;
    if (
      resolution.status !== 0 ||
      resolution.stdout !== JSON.stringify([expectedRoot, expectedRegistration])
    )
      throw new Error(`Independent Node export-map resolution failed: ${resolution.stderr}`);
    for (const [name, entry] of [
      ["retained", "DistributionRetained"],
      ["root-only", "DistributionRootOnly"],
      ["ordinary-metadata", "DistributionOrdinaryMetadata"],
      ["shared-metadata", "DistributionSharedMetadata"],
    ] as const) {
      // The retained entry imports only registration; a separate root-only observer reads its real records in the same graph.
      await DistributionContractPrepare.#writeBuildConfig(name, entry, consumer);
      this.command([
        "exec",
        "vite",
        "build",
        "--config",
        fileURLToPath(new URL("vite.config.mjs", consumer)),
      ]);
    }
    await writeFile(
      new URL("../preparation.json", consumer),
      JSON.stringify({
        independentTypes: "passed",
        bundles: ["retained", "root-only", "ordinary-metadata", "shared-metadata"],
        runtimeDependencies: [],
        node: process.version,
        rootEntry: root.import,
        declarationEntry: root.types,
        registrationEntry: registration.import,
        registrationDeclarationEntry: registration.types,
        resolvedNodeRoot: expectedRoot,
        resolvedNodeRegistration: expectedRegistration,
      }),
    );
  }

  static #validateManifest(value: unknown): {
    readonly root: IDistributionEntry;
    readonly registration: IDistributionEntry;
  } {
    if (!DistributionContractPrepare.#isRecord(value))
      throw new Error(
        "Independent consumer requires a root export map and no runtime dependencies",
      );
    if (!("exports" in value) || !("sideEffects" in value))
      throw new Error(
        "Independent consumer requires a root export map and no runtime dependencies",
      );
    if ("dependencies" in value && Object.keys(Object(value.dependencies)).length !== 0)
      throw new Error(
        "Independent consumer requires a root export map and no runtime dependencies",
      );
    if (!DistributionContractPrepare.#isRecord(value.exports))
      throw new Error("The distribution must expose exactly its root and registration entry");
    const exports = value.exports;
    if (Object.keys(exports).length !== 2 || !("." in exports) || !("./register" in exports))
      throw new Error("The distribution must expose exactly its root and registration entry");
    if (
      !Array.isArray(value.sideEffects) ||
      value.sideEffects.length !== 1 ||
      value.sideEffects[0] !== "./dist/register.js"
    )
      throw new Error("Exact generated entries and registration-only effects must be declared");
    return {
      root: DistributionContractPrepare.#entry(
        exports["."],
        "./dist/index.js",
        "./dist/index.d.ts",
      ),
      registration: DistributionContractPrepare.#entry(
        exports["./register"],
        "./dist/register.js",
        "./dist/register.d.ts",
      ),
    };
  }

  static #isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  static #entry(value: unknown, expectedImport: string, expectedTypes: string): IDistributionEntry {
    if (!DistributionContractPrepare.#isRecord(value))
      throw new Error("Exact generated entries and registration-only effects must be declared");
    if (
      value.import !== expectedImport ||
      value.types !== expectedTypes ||
      Object.keys(value).length !== 2
    )
      throw new Error("Exact generated entries and registration-only effects must be declared");
    return { import: expectedImport, types: expectedTypes };
  }

  static async #writeBuildConfig(name: string, entry: string, consumer: URL): Promise<void> {
    const retained = name === "retained";
    const entries = retained
      ? {
          retained: fileURLToPath(new URL("DistributionRetained.js", consumer)),
          "retained-observer": fileURLToPath(new URL("DistributionOrdinaryMetadata.js", consumer)),
        }
      : fileURLToPath(new URL(`${entry}.js`, consumer));
    await writeFile(
      new URL("vite.config.mjs", consumer),
      `export default ${JSON.stringify({
        root: fileURLToPath(consumer),
        build: {
          target: "es2023",
          minify: false,
          emptyOutDir: false,
          lib: { entry: entries, formats: ["es"], ...(retained ? {} : { fileName: name }) },
          outDir: fileURLToPath(new URL("bundle/", consumer)),
        },
      })};\n`,
    );
  }
}
