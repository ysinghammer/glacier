import type { ISerializedError } from "./ISerializedError.js";
import { SafeValueSerializer } from "./SafeValueSerializer.js";

const MAX_CAUSE_DEPTH = 5;
const MAX_DEPTH_PLACEHOLDER = "[Max depth]";
const CANONICAL_KEYS: ReadonlySet<string> = new Set(["type", "message", "stack", "cause"]);

/** Converts errors into plain records with canonical fields and enumerable custom properties. */
export class ErrorSerializer {
  /** Serializes an error, substituting an unreadable placeholder if inspection fails.
   * @param error - Error object to convert.
   * @returns Canonical error data and serialized enumerable properties.
   */
  public static serialize(error: Error): ISerializedError {
    return ErrorSerializer.serializeWithin(error, new Set([error]), 0);
  }

  /** Serializes an error within an existing traversal and bounds nested error causes.
   * @param error - Error object to convert.
   * @param ancestors - Active objects shared with value serialization for cycle detection.
   * @param depth - Current value-serialization depth.
   * @param causeLevel - Cause-chain depth; defaults to 0 for the initial error.
   * @returns Error data, or a placeholder record if inspection fails.
   */
  public static serializeWithin(
    error: Error,
    ancestors: Set<object>,
    depth: number,
    causeLevel = 0,
  ): ISerializedError {
    try {
      return ErrorSerializer.serializeUnsafe(error, ancestors, depth, causeLevel);
    } catch {
      return { type: "Error", message: "[Unserializable]" };
    }
  }

  /** Reads canonical error fields and serializes non-canonical enumerable properties.
   * @param error - Error object being inspected.
   * @param ancestors - Active traversal objects for nested values.
   * @param depth - Current value-serialization depth.
   * @param causeLevel - Current nested cause count.
   * @returns A record containing serialized error data.
   */
  private static serializeUnsafe(
    error: Error,
    ancestors: Set<object>,
    depth: number,
    causeLevel: number,
  ): ISerializedError {
    const propertyKeys = Object.keys(error).filter((key) => !CANONICAL_KEYS.has(key));
    const properties = SafeValueSerializer.serializeProperties(
      error,
      propertyKeys,
      ancestors,
      depth,
    );
    const stack = typeof error.stack === "string" ? { stack: error.stack } : {};
    const cause =
      error.cause === undefined
        ? {}
        : { cause: ErrorSerializer.serializeCause(error.cause, ancestors, depth, causeLevel) };
    return {
      ...properties,
      type: String(error.name),
      message: String(error.message),
      ...stack,
      ...cause,
    };
  }

  /** Serializes a cause value and bounds nesting when it is itself an error.
   * @param cause - Error or other value supplied as a cause.
   * @param ancestors - Active traversal objects for cycle detection.
   * @param depth - Current value-serialization depth.
   * @param causeLevel - Number of error causes already traversed.
   * @returns Serialized cause data or the depth-limit placeholder.
   */
  private static serializeCause(
    cause: unknown,
    ancestors: Set<object>,
    depth: number,
    causeLevel: number,
  ): unknown {
    if (!(cause instanceof Error)) {
      return SafeValueSerializer.serializeWithin(cause, ancestors, depth);
    }
    if (causeLevel >= MAX_CAUSE_DEPTH) {
      return MAX_DEPTH_PLACEHOLDER;
    }
    return ErrorSerializer.serializeWithin(cause, ancestors, depth, causeLevel + 1);
  }
}
