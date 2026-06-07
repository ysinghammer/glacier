export class ValidationError extends Error {
  public readonly code: string;
  public readonly path: Array<string | number>;

  /**
   * Constructs a validation error with a unique code, message and an optional path to the failing location.
   * @param code - A unique error code identifying the validation rule that failed.
   * @param message - A human-readable description of the error.
   * @param path - Optional path (as segments) from the current schema root to the failing location.
   */
  public constructor(code: string, message: string, path: Array<string | number> = []) {
    super(message);
    this.code = code;
    this.path = path;
    this.name = 'ValidationError';
  }

  /**
   * Returns the path as a JSONPath-like string starting with `$`.
   */
  public toPathString(): string {
    let out = '$';
    for (const seg of this.path) {
      if (typeof seg === 'number') {
        out += `[${seg.toString()}]`;
      } else {
        out += `.${seg}`;
      }
    }
    return out;
  }

  /**
   * Returns a new ValidationError with the provided segment prefixed to the existing path.
   */
  public withPrefix(segment: string | number): ValidationError {
    return new ValidationError(this.code, this.message, [segment, ...this.path]);
  }
}
