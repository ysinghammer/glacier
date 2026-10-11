import { randomUUID } from "node:crypto";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

/** Report kinds written beneath `tests/artifacts/<invocation>/`. */
type ReportKind = "acceptance-report" | "tooling-verification" | "docs-verification";

/** Number of run directories retained per report kind, including the current invocation. */
const RETAINED_RUNS = 5;

/** A previous invocation's report directory with its last modification time. */
interface IReportRun {
  readonly run: string;
  readonly modifiedMs: number;
}

/** Allocates independent, Git-ignored report directories for each tooling invocation. */
export class ReportDirectoryService {
  /**
   * Creates an invocation directory, then removes all but the five newest run directories containing the same kind
   * (by the kind directory's modification time). The current invocation is never removed and other kinds are left
   * untouched. Runs removed concurrently are tolerated; other filesystem errors propagate to fail the invocation.
   */
  public static async create(root: string, kind: ReportKind): Promise<string> {
    const directory = join(root, "tests/artifacts", randomUUID(), kind);
    await mkdir(directory, { recursive: true });
    await ReportDirectoryService.prune(join(root, "tests/artifacts"), kind, dirname(directory));
    return directory;
  }

  /** Removes the oldest runs of `kind` so that at most five, including `current`, remain. */
  private static async prune(artifacts: string, kind: ReportKind, current: string): Promise<void> {
    const runs: IReportRun[] = [];
    for (const entry of await readdir(artifacts, { withFileTypes: true })) {
      const run = join(artifacts, entry.name);
      if (!entry.isDirectory() || run === current) continue;
      const modifiedMs = await ReportDirectoryService.modifiedMs(join(run, kind));
      if (modifiedMs !== undefined) runs.push({ run, modifiedMs });
    }
    runs.sort((left, right) => right.modifiedMs - left.modifiedMs);
    for (const { run } of runs.slice(RETAINED_RUNS - 1)) {
      await rm(run, { recursive: true, force: true });
    }
  }

  /** Returns the kind directory's modification time, or `undefined` when it does not exist. */
  private static async modifiedMs(path: string): Promise<number | undefined> {
    try {
      const details = await stat(path);
      return details.isDirectory() ? details.mtimeMs : undefined;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
      throw error;
    }
  }
}
