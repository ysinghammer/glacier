/** Exact property paths and replacement text used to redact each log entry. */
export interface IRedaction {
  /** Dot-separated paths; each segment names an exact property without wildcards. */
  readonly paths: readonly string[];
  /** Text substituted for each matching value. */
  readonly censor: string;
}
