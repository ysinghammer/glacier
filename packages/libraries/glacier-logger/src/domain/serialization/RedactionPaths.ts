const REDACTION_PATH_PATTERN = /^[^.*\s]+(\.[^.*\s]+)*$/;

/** Validates exact dot-separated redaction paths without wildcard or whitespace segments. */
export class RedactionPaths {
  /** Checks whether a path contains only valid exact-match segments.
   * @param path - Candidate path; segments are separated by dots.
   * @returns `true` when all segments are non-empty and contain no whitespace or wildcards.
   */
  public static isValid(path: string): boolean {
    return REDACTION_PATH_PATTERN.test(path);
  }
}
