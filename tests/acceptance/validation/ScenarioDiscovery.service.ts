import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

/** Associates a discovered spec with its explicit test-owned scenario metadata. */
export interface IDiscoveredTest {
  readonly path: string;
  readonly scenarioIds: readonly string[];
}

/** Discovers .spec.ts files beneath tests/scenarios only, excluding support and artifacts. */
export class ScenarioDiscoveryService {
  /** Returns an empty list only when the optional scenario directory does not exist. */
  public static async discover(root: string): Promise<readonly IDiscoveredTest[]> {
    const directory = join(root, "tests/scenarios");
    try {
      return await ScenarioDiscoveryService.walk(root, directory);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT" &&
        "path" in error &&
        error.path === directory
      ) {
        return [];
      }
      throw error;
    }
  }

  /** Reads anchored @scenario comments as static metadata; does not execute specs or import product code. */
  private static async walk(root: string, directory: string): Promise<readonly IDiscoveredTest[]> {
    const tests: IDiscoveredTest[] = [];
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Scenario discovery forbids symbolic links: ${path}`);
      }
      if (entry.isDirectory()) {
        tests.push(...(await ScenarioDiscoveryService.walk(root, path)));
      } else if (entry.isFile() && entry.name.endsWith(".spec.ts")) {
        const source = await readFile(path, "utf8");
        const scenarioIds = Array.from(
          source.matchAll(/^\/\/ @scenario ([A-Za-z0-9][A-Za-z0-9._:-]*)\r?$/gm),
          (match) => match[1],
        );
        const identifiers: string[] = [];
        for (const identifier of scenarioIds) {
          if (identifier === undefined) throw new Error(`Invalid scenario metadata in ${path}`);
          identifiers.push(identifier);
        }
        tests.push({ path: relative(root, path).split(sep).join("/"), scenarioIds: identifiers });
      }
    }
    return tests;
  }
}
