import { readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import v8 from "@vitest/coverage-v8";
import { V8CoverageProvider } from "@vitest/coverage-v8/dist/provider.js";
import type { ScriptCoverageWithOffset } from "@vitest/coverage-v8/dist/provider.js";
import type { CoverageProviderModule, TestProject } from "vitest/node";

/** Coverage record shape consumed for canonical span matching without changing counters. */
type ISourceCoverage = ReturnType<
  ReturnType<V8CoverageProvider["createCoverageMap"]>["fileCoverageFor"]
>["data"];

/**
 * Adapts the pinned V8 provider to combine native compiler maps with transformed source coverage.
 * Keeps native and transformed offsets separate until built-in source conversion.
 */
class ReflectionCoverageProvider extends V8CoverageProvider {
  /**
   * Mutable flag enabling source inclusion only during native conversion; starts disabled.
   * @default false
   */
  private isNativeConversion = false;

  /**
   * Includes compiled files only during native conversion; ordinary source filtering stays upstream.
   * @param filename Source or generated filename being checked.
   * @param root Optional project root forwarded to the base provider.
   * @returns Whether the configured source or an eligible generated equivalent is included.
   */
  public override isIncluded(filename: string, root?: string): boolean {
    const generated = relative(resolve(this.ctx.config.root, "dist"), filename);
    if (generated.endsWith(".js") && !generated.startsWith(`..${sep}`) && generated !== "..") {
      return (
        this.isNativeConversion &&
        super.isIncluded(resolve(this.ctx.config.root, generated.replace(/\.js$/, ".ts")), root)
      );
    }
    return super.isIncluded(filename, root);
  }

  /**
   * Supplies compiler maps to the base converter while leaving Vite transforms unchanged.
   * @param url File URL or path being converted.
   * @param project Vitest project owning the coverage conversion.
   * @param environment Runtime environment associated with the file.
   * @param isTransformedByVite Whether Vitest already transformed the source; defaults to `true`.
   * @returns Base conversion result with compiler map sources when applicable.
   * @throws {Error} When compiler mapping data is missing or malformed.
   */
  public override async transformFile(
    url: string,
    project: TestProject,
    environment: string,
    isTransformedByVite = true,
  ): ReturnType<V8CoverageProvider["transformFile"]> {
    const result = await super.transformFile(url, project, environment, isTransformedByVite);
    if (isTransformedByVite || !url.startsWith(`${resolve(this.ctx.config.root, "dist")}${sep}`)) {
      return result;
    }
    const map: unknown = JSON.parse(await readFile(`${url}.map`, "utf8"));
    if (result == null || !ReflectionCoverageProvider.isSourceMap(map))
      throw new Error(`Invalid compiler source map: ${url}`);
    const sourceMap = {
      version: 3,
      file: map.file,
      sources: map.sources,
      names: map.names,
      mappings: map.mappings,
      sourcesContent: await Promise.all(
        map.sources.map((source) => readFile(resolve(dirname(url), source), "utf8")),
      ),
      /**
       * Serializes this source-map-compatible record as JSON text.
       * @returns JSON representation of this map.
       */
      toString() {
        return JSON.stringify(this);
      },
      /**
       * Encodes the serialized map as a data URL for the coverage converter.
       * @returns Base64 JSON data URL for this map.
       */
      toUrl() {
        return `data:application/json;base64,${Buffer.from(this.toString()).toString("base64")}`;
      },
    };
    return { ...result, map: sourceMap };
  }

  /**
   * Narrows unknown compiler map data to the exact source-map fields consumed below.
   * @param map Untrusted parsed map value.
   * @returns Whether the value has the required version-3 map structure.
   */
  private static isSourceMap(map: unknown): map is {
    /** Readonly source-map format version, fixed at `3`. */
    readonly version: 3;
    /** Readonly generated JavaScript filename recorded by the compiler. */
    readonly file: string;
    /** Readonly empty source root required by the fixture compiler output. */
    readonly sourceRoot: "";
    /** Readonly reference to relative TypeScript source paths in the map. */
    readonly sources: string[];
    /** Readonly reference to identifier names recorded by the compiler. */
    readonly names: string[];
    /** Readonly encoded generated-to-source position mappings. */
    readonly mappings: string;
  } {
    return !(
      map === null ||
      typeof map !== "object" ||
      !("version" in map) ||
      map.version !== 3 ||
      !("file" in map) ||
      typeof map.file !== "string" ||
      !("sourceRoot" in map) ||
      map.sourceRoot !== "" ||
      !("sources" in map) ||
      !Array.isArray(map.sources) ||
      !map.sources.every((source: unknown) => typeof source === "string") ||
      !("names" in map) ||
      !Array.isArray(map.names) ||
      !map.names.every((name: unknown) => typeof name === "string") ||
      !("mappings" in map) ||
      typeof map.mappings !== "string"
    );
  }

  /**
   * Wraps coverage-map merging to align native spans with equivalent source spans first.
   * @returns A coverage map that preserves native and transformed counter data during merge.
   */
  public override createCoverageMap(): ReturnType<V8CoverageProvider["createCoverageMap"]> {
    const map = super.createCoverageMap();
    const merge = map.merge.bind(map);
    map.merge = (input) => {
      const incoming = super.createCoverageMap();
      incoming.merge(input);
      if (this.isNativeConversion) {
        for (const filename of incoming.files()) {
          if (map.files().includes(filename)) {
            ReflectionCoverageProvider.normalizeSpans(
              incoming.fileCoverageFor(filename).data,
              map.fileCoverageFor(filename).data,
            );
          }
        }
      }
      merge(incoming);
    };
    return map;
  }

  /**
   * Reuses matching source locations for native statements, functions, and branches.
   * @param native Native compiler coverage data whose spans are normalized in place.
   * @param source Vite/source coverage data used as the canonical location set.
   * @returns No value; updates only span-map locations, preserving counters.
   * @throws {Error} When a native span has zero or multiple source matches.
   */
  private static normalizeSpans(native: ISourceCoverage, source: ISourceCoverage): void {
    for (const [id, location] of Object.entries(native.statementMap)) {
      const matches = Object.values(source.statementMap).filter(
        (candidate) =>
          candidate.start.line === location.start.line &&
          candidate.start.column === location.start.column,
      );
      if (matches.length !== 1 || matches[0] === undefined) {
        throw new Error(`Ambiguous compiler statement map: ${native.path}:${location.start.line}`);
      }
      native.statementMap[id] = matches[0];
    }
    for (const [id, fn] of Object.entries(native.fnMap)) {
      const matches = Object.values(source.fnMap).filter(
        (candidate) =>
          candidate.decl.start.line === fn.decl.start.line &&
          candidate.loc.end.line === fn.loc.end.line &&
          (candidate.name === fn.name ||
            (candidate.name.startsWith("(anonymous_") && fn.name.startsWith("(anonymous_"))),
      );
      if (matches.length !== 1 || matches[0] === undefined) {
        throw new Error(`Ambiguous compiler function map: ${native.path}:${fn.decl.start.line}`);
      }
      native.fnMap[id] = matches[0];
    }
    for (const [id, branch] of Object.entries(native.branchMap)) {
      const matches = Object.values(source.branchMap).filter(
        (candidate) =>
          candidate.type === branch.type &&
          candidate.locations.length === branch.locations.length &&
          candidate.locations.every(
            (location, index) =>
              location.start.line === branch.locations[index]?.start.line &&
              location.start.column === branch.locations[index]?.start.column,
          ),
      );
      if (matches.length !== 1 || matches[0] === undefined) {
        throw new Error(`Ambiguous compiler branch map: ${native.path}:${branch.loc.start.line}`);
      }
      native.branchMap[id] = matches[0];
    }
  }

  /**
   * Converts ordinary and native execution contexts separately before combining coverage.
   * @template CoverageType Coverage payload type accepted by the base provider callbacks.
   * @param options Base reader options with the caller's coverage-file callback.
   * @returns Resolves with no value after all coverage files and native contexts are processed.
   */
  public override async readCoverageFiles<CoverageType>(
    options: Omit<Parameters<V8CoverageProvider["readCoverageFiles"]>[0], "onFileRead"> & {
      /**
       * Mutable callback receiving each payload after its execution context is separated.
       * @param data Context-specific coverage payload supplied by the base provider.
       * @returns No value; forwards converted coverage to the caller.
       */
      onFileRead: (data: CoverageType) => void;
    },
  ): Promise<void> {
    let nativeScripts: ScriptCoverageWithOffset[] = [];
    await super.readCoverageFiles<CoverageType>({
      ...options,
      onFileRead(coverage) {
        // The base reader is generic; this subclass consumes only the pinned V8 result format.
        const raw = coverage as { result: ScriptCoverageWithOffset[] };
        const viteScripts: ScriptCoverageWithOffset[] = [];
        for (const script of raw.result) {
          if (script.isExtendedContext) nativeScripts.push(script);
          else viteScripts.push(script);
        }
        options.onFileRead({ result: viteScripts } as CoverageType);
      },
      onFinished: async (project, environment) => {
        await options.onFinished(project, environment);
        if (nativeScripts.length !== 0) {
          options.onFileRead({ result: nativeScripts } as CoverageType);
          this.isNativeConversion = true;
          try {
            await options.onFinished(project, environment);
          } finally {
            this.isNativeConversion = false;
            nativeScripts = [];
          }
        }
      },
    });
  }
}

export default {
  ...v8,
  /**
   * Uses the pinned collector, native conversion, reporters, and threshold enforcement.
   * @returns A fresh provider configured for this package's native coverage normalization.
   */
  getProvider(): ReflectionCoverageProvider {
    return new ReflectionCoverageProvider();
  },
} satisfies CoverageProviderModule;
