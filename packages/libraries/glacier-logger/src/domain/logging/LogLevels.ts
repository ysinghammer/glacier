import type { ILogLevel } from "./types/ILogLevel.js";

const LEVEL_VALUES: Readonly<Record<ILogLevel, number>> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

/** Validates level names and compares their internal severity ordering. */
export class LogLevels {
  /** Narrows an unknown value to one of the supported level names.
   * @param value - Untrusted value to validate.
   * @returns `true` only for an own supported level name.
   */
  public static isLogLevel(value: unknown): value is ILogLevel {
    return typeof value === "string" && Object.hasOwn(LEVEL_VALUES, value);
  }

  /** Compares two levels by severity, with equal levels accepted.
   * @param level - Candidate level whose severity is tested.
   * @param minimum - Inclusive minimum severity.
   * @returns `true` when `level` is at least as severe as `minimum`.
   */
  public static isAtLeast(level: ILogLevel, minimum: ILogLevel): boolean {
    return LEVEL_VALUES[level] >= LEVEL_VALUES[minimum];
  }
}
