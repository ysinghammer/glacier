import type { IReservedKey } from "./types/IReservedKey.js";

const RESERVED_KEYS: ReadonlySet<string> = new Set<IReservedKey>([
  "message",
  "err",
  "level",
  "time",
  "context",
]);

/** Identifies entry fields owned by the logger and unavailable to user data. */
export class ReservedKeys {
  /** Checks whether a field name belongs to the logger-managed entry contract.
   * @param key - Candidate field name to check.
   * @returns `true` for a reserved name, narrowing it to `IReservedKey`.
   */
  public static isReserved(key: string): key is IReservedKey {
    return RESERVED_KEYS.has(key);
  }
}
