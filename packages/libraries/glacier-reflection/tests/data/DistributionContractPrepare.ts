import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** Builds an isolated consumer containing only the copied distribution and its authored fixtures. */
class DistributionContractPrepare {
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

  /** Copies generated ESM/declarations and verifies independent root declaration consumption. */
  public static async run(): Promise<void> {
    const consumer = new URL("../artifacts/t017/attempt2/consumer/", import.meta.url);
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
    ]) {
      await cp(
        new URL(`../artifacts/compiler/${name}.js`, import.meta.url),
        new URL(`${name}.js`, consumer),
      );
    }
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
    if (
      manifest === null ||
      typeof manifest !== "object" ||
      !("exports" in manifest) ||
      !("sideEffects" in manifest) ||
      ("dependencies" in manifest && Object.keys(Object(manifest.dependencies)).length !== 0)
    )
      throw new Error(
        "Independent consumer requires a root export map and no runtime dependencies",
      );
    const exports = manifest.exports;
    if (
      exports === null ||
      typeof exports !== "object" ||
      Object.keys(exports).length !== 1 ||
      !("." in exports)
    )
      throw new Error("The distribution must expose only its package root");
    const root = exports["."];
    if (
      root === null ||
      typeof root !== "object" ||
      !("import" in root) ||
      typeof root.import !== "string" ||
      !("types" in root) ||
      typeof root.types !== "string" ||
      manifest.sideEffects !== true
    )
      throw new Error("Root ESM/declarations and intentional import effects must be declared");
    const resolution = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        'process.stdout.write(import.meta.resolve("@glacier/reflection"))',
      ],
      { cwd: consumer, encoding: "utf8", timeout: 8_000 },
    );
    if (resolution.error !== undefined) throw resolution.error;
    const expectedRoot = new URL(root.import, packageDirectory).href;
    if (resolution.status !== 0 || resolution.stdout !== expectedRoot)
      throw new Error(`Independent Node export-map resolution failed: ${resolution.stderr}`);
    await writeFile(
      new URL("vite.config.mjs", consumer),
      `export default ${JSON.stringify({
        root: fileURLToPath(consumer),
        build: {
          target: "es2023",
          minify: false,
          lib: {
            entry: fileURLToPath(new URL("DistributionRetained.js", consumer)),
            formats: ["es"],
            fileName: "retained",
          },
          outDir: fileURLToPath(new URL("bundle/", consumer)),
        },
      })};\n`,
    );
    this.command([
      "exec",
      "vite",
      "build",
      "--config",
      fileURLToPath(new URL("vite.config.mjs", consumer)),
    ]);
    await writeFile(
      new URL("../preparation.json", consumer),
      JSON.stringify({
        independentTypes: "passed",
        bundle: "built",
        runtimeDependencies: [],
        node: process.version,
        rootEntry: root.import,
        declarationEntry: root.types,
        resolvedNodeRoot: resolution.stdout,
      }),
    );
  }
}

await DistributionContractPrepare.run();
