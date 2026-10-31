const REDACTION_PATH_PATTERN = /^[^.*\s]+(\.[^.*\s]+)*$/;

/** Syntax rules for redaction paths: exact dot-separated segments, no wildcards. */
export class RedactionPaths {
  /** True when every segment is non-empty and free of whitespace and wildcards. */
  static isValid(path: string): boolean {
    return REDACTION_PATH_PATTERN.test(path);
  }
}
