import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Commit scope accepted for monorepo-wide changes that no single package owns. */
const WORKSPACE_SCOPE = "workspace";

/** Directory-name prefix omitted from package commit scopes, for example `glacier-reflection` → `reflection`. */
const PACKAGE_PREFIX = "glacier-";

/** Characters commitlint treats as separators between several scopes. */
const SCOPE_DELIMITER = /[,/\\]/;

/** Derives the allowed commit scopes from the workspace layout and rejects multi-scope headers. */
class CommitScopes {
  /**
   * Lists `workspace` plus every package directory matched by `pnpm-workspace.yaml`'s `<dir>/*` globs, without the
   * `glacier-` prefix. Missing glob directories yield no scopes; unreadable workspace files throw.
   */
  public static resolve(root: string): string[] {
    const workspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
    const scopes = new Set<string>([WORKSPACE_SCOPE]);
    for (const glob of CommitScopes.packageGlobs(workspace)) {
      for (const entry of CommitScopes.directories(join(root, glob.slice(0, -"/*".length)))) {
        scopes.add(entry.startsWith(PACKAGE_PREFIX) ? entry.slice(PACKAGE_PREFIX.length) : entry);
      }
    }
    return [...scopes].sort();
  }

  /** Rule outcome rejecting a header scope that contains a commitlint scope delimiter. */
  public static singleScope(parsed: { readonly scope?: string | null }): [boolean, string] {
    const isSingle = !SCOPE_DELIMITER.test(parsed.scope ?? "");
    return [isSingle, "scope must name exactly one package or workspace"];
  }

  /** Reads the `packages:` list entries of the form `<dir>/*`; other glob forms are unsupported and throw. */
  private static packageGlobs(workspace: string): string[] {
    const globs: string[] = [];
    let isInPackages = false;
    for (const line of workspace.split(/\r?\n/)) {
      if (/^\S/.test(line)) {
        isInPackages = line.trim() === "packages:";
        continue;
      }
      const match = /^\s+-\s+["']?([^"'\s]+)["']?\s*$/.exec(line);
      if (!isInPackages || match?.[1] === undefined) continue;
      if (!match[1].endsWith("/*")) throw new Error(`Unsupported workspace glob: ${match[1]}`);
      globs.push(match[1]);
    }
    return globs;
  }

  /** Lists child directory names, or none when the glob's parent directory does not exist. */
  private static directories(path: string): string[] {
    try {
      return readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
      throw error;
    }
  }
}

const configuration = {
  extends: ["@commitlint/config-conventional"],
  plugins: [{ rules: { "scope-single": CommitScopes.singleScope } }],
  rules: {
    "scope-empty": [2, "never"],
    "scope-enum": [2, "always", CommitScopes.resolve(dirname(fileURLToPath(import.meta.url)))],
    "scope-single": [2, "always"],
  },
};

export default configuration;
