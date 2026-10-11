import { readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import v8 from "@vitest/coverage-v8";
import { V8CoverageProvider } from "@vitest/coverage-v8/dist/provider.js";
import type { ScriptCoverageWithOffset } from "@vitest/coverage-v8/dist/provider.js";
import type { CoverageProviderModule, TestProject } from "vitest/node";

/** The built-in source coverage record, whose counters remain untouched during span normalization. */
type ISourceCoverage = ReturnType<
  ReturnType<V8CoverageProvider["createCoverageMap"]>["fileCoverageFor"]
>["data"];

/** Keeps native and Vite-transformed V8 offsets separate until the built-in source conversion. */
class ReflectionCoverageProvider extends V8CoverageProvider {
  #isNativeConversion = false;

  /** Includes compiled equivalents of every configured production file, without expanding or hiding sources. */
  public override isIncluded(filename: string, root?: string): boolean {
    const generated = relative(resolve(this.ctx.config.root, "dist"), filename);
    if (generated.endsWith(".js") && !generated.startsWith(`..${sep}`) && generated !== "..") {
      return (
        this.#isNativeConversion &&
        super.isIncluded(resolve(this.ctx.config.root, generated.replace(/\.js$/, ".ts")), root)
      );
    }
    return super.isIncluded(filename, root);
  }

  /** Supplies exact compiler JS/maps to the built-in converter; Vitest still owns ordinary source transforms. */
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
    if (
      result == null ||
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
    )
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
      toString() {
        return JSON.stringify(this);
      },
      toUrl() {
        return `data:application/json;base64,${Buffer.from(this.toString()).toString("base64")}`;
      },
    };
    return { ...result, map: sourceMap };
  }

  /** Aligns equivalent compiler/source spans before the built-in merge; ambiguous or missing matches fail. */
  public override createCoverageMap(): ReturnType<V8CoverageProvider["createCoverageMap"]> {
    const map = super.createCoverageMap();
    const merge = map.merge.bind(map);
    map.merge = (input) => {
      const incoming = super.createCoverageMap();
      incoming.merge(input);
      if (this.#isNativeConversion) {
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

  /** Canonicalizes only uniquely matching source nodes; never changes a hit count or drops an executable node. */
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

  /** Converts each execution context before merging source coverage, never merging incompatible raw offsets. */
  public override async readCoverageFiles<CoverageType>(
    options: Omit<Parameters<V8CoverageProvider["readCoverageFiles"]>[0], "onFileRead"> & {
      onFileRead: (data: CoverageType) => void;
    },
  ): Promise<void> {
    const provider = this;
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
      async onFinished(project, environment) {
        await options.onFinished(project, environment);
        if (nativeScripts.length !== 0) {
          options.onFileRead({ result: nativeScripts } as CoverageType);
          provider.#isNativeConversion = true;
          try {
            await options.onFinished(project, environment);
          } finally {
            provider.#isNativeConversion = false;
            nativeScripts = [];
          }
        }
      },
    });
  }
}

export default {
  ...v8,
  /** Uses the pinned collector, native stripping/source conversion, reporter and threshold enforcement. */
  getProvider(): ReflectionCoverageProvider {
    return new ReflectionCoverageProvider();
  },
} satisfies CoverageProviderModule;
