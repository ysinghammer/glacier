import type { ISerializedError } from "./ISerializedError.js";
import { SafeValueSerializer } from "./SafeValueSerializer.js";

const MAX_CAUSE_DEPTH = 5;
const MAX_DEPTH_PLACEHOLDER = "[Max depth]";
const CANONICAL_KEYS: ReadonlySet<string> = new Set(["type", "message", "stack", "cause"]);

/** Turns an `Error` into `{ type, message, stack, cause }` plus its own enumerable properties. */
export class ErrorSerializer {
  /** Serialises `error`. Never throws: an unreadable error becomes a placeholder error. */
  static serialize(error: Error): ISerializedError {
    return ErrorSerializer.serializeWithin(error, new Set([error]), 0);
  }

  /**
   * Serialises an error reached through `ancestors`, the objects currently being serialised.
   * Causes nest up to five levels; deeper causes become `"[Max depth]"`.
   */
  static serializeWithin(
    error: Error,
    ancestors: Set<object>,
    depth: number,
    causeLevel = 0,
  ): ISerializedError {
    try {
      return ErrorSerializer.#serializeUnsafe(error, ancestors, depth, causeLevel);
    } catch {
      return { type: "Error", message: "[Unserializable]" };
    }
  }

  static #serializeUnsafe(
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
        : { cause: ErrorSerializer.#serializeCause(error.cause, ancestors, depth, causeLevel) };
    return {
      ...properties,
      type: String(error.name),
      message: String(error.message),
      ...stack,
      ...cause,
    };
  }

  static #serializeCause(
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
