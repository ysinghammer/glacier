import type { IMigrationNamesResult } from "./IMigrationNamesResult.js";

/** Enforces the forward-only, contiguous migration filename sequence. */
export class MigrationNames {
  /**
   * Selects SQL files and checks their names and sequence from 0001 without gaps.
   * @param names Directory entry names, including non-SQL entries.
   * @returns Ordered names on success, or a rejection for malformed or duplicate numbers.
   */
  public static validate(names: readonly string[]): IMigrationNamesResult {
    const sqlNames = names.filter((name) => name.endsWith(".sql")).sort();
    let expected = 1;
    for (const name of sqlNames) {
      if (!/^\d{4}_[A-Za-z0-9][A-Za-z0-9_-]*\.sql$/.test(name)) return { ok: false };
      if (Number(name.slice(0, 4)) !== expected) return { ok: false };
      expected += 1;
    }
    return { ok: true, names: sqlNames };
  }
}
