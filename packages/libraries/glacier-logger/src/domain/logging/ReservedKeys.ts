import type { IReservedKey } from "./IReservedKey.js";

const RESERVED_KEYS: ReadonlySet<string> = new Set<IReservedKey>([
  "message",
  "err",
  "level",
  "time",
  "context",
]);

/** Knowledge of the keys the logger owns in every entry. */
export class ReservedKeys {
  /** Returns `true` when `key` is owned by the logger. */
  static isReserved(key: string): key is IReservedKey {
    return RESERVED_KEYS.has(key);
  }
}
