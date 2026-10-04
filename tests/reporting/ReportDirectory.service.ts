import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

/** Allocates independent, Git-ignored report directories for each tooling invocation. */
export class ReportDirectoryService {
  /** Creates an invocation directory; filesystem errors propagate to fail the invocation. */
  public static async create(
    root: string,
    kind: "acceptance-report" | "tooling-verification",
  ): Promise<string> {
    const directory = join(root, "tests/artifacts", randomUUID(), kind);
    await mkdir(directory, { recursive: true });
    return directory;
  }
}
