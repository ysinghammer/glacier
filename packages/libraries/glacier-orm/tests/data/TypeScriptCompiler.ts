import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

/** Invokes the workspace's pinned TypeScript compiler without depending on its unstable API. */
export class TypeScriptCompiler {
  /**
   * Executes the compiler with the supplied arguments and returns its standard output.
   * @param root Project directory used as the compiler's working directory.
   * @param args Compiler arguments passed without shell interpretation.
   * @returns Compiler output; a failed invocation propagates its process error.
   */
  public static run(root: string, args: readonly string[]): string {
    const require = createRequire(import.meta.url);
    const compiler = resolve(dirname(require.resolve("typescript/package.json")), "bin/tsc");
    return execFileSync(process.execPath, [compiler, ...args], { cwd: root, encoding: "utf8" });
  }
}
