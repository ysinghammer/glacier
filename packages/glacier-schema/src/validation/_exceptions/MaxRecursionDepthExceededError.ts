import { AppError } from './AppError.js';

/**
 * Thrown while validating a `Schema.recursive` structure once the
 * configured `maxDepth` has been exceeded. Guards against unbounded/cyclic
 * runtime input causing an actual stack overflow.
 */
export class MaxRecursionDepthExceededError extends AppError {
  /**
   * @param maxDepth The configured recursion depth limit that was exceeded.
   */
  public constructor(public readonly maxDepth: number) {
    super(
      `Recursive schema exceeded the maximum allowed depth of ${String(maxDepth)}`,
      'schema-max-recursion-depth-exceeded'
    );
  }
}
