import type { ILogLevel } from "./ILogLevel.js";

const LEVEL_VALUES: Readonly<Record<ILogLevel, number>> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

/** Level parsing and comparison. Numeric severities stay internal to this class. */
export class LogLevels {
  /** Narrows an untrusted value to a known level name. */
  static isLogLevel(value: unknown): value is ILogLevel {
    return typeof value === "string" && Object.hasOwn(LEVEL_VALUES, value);
  }

  /** Returns `true` when `level` is at or above `minimum` in severity. */
  static isAtLeast(level: ILogLevel, minimum: ILogLevel): boolean {
    return LEVEL_VALUES[level] >= LEVEL_VALUES[minimum];
  }
}
